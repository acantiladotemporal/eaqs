import { createCipheriv, createHmac, timingSafeEqual } from 'node:crypto';

/** Redirect protocol documented by Redsys; this module never sends a payment. */
export const REDSYS_SIGNATURE_VERSION = 'HMAC_SHA512_V2' as const;
export const REDSYS_ENDPOINTS = Object.freeze({
  sandbox: 'https://sis-t.redsys.es:25443/sis/realizarPago',
  production: 'https://sis.redsys.es/sis/realizarPago',
});

export interface RedsysConfig {
  merchantCode: string;
  terminal: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
  /** Trusted server configuration, never a request parameter. */
  siteOrigin?: string;
}
export interface PaymentInput {
  order: string;
  amountCents: number;
  currency: '978' | 978;
  merchantURL: string;
  successURL: string;
  failureURL: string;
}
export interface VerifiedNotification {
  order: string;
  amountCents: number;
  currency: '978';
  merchantCode: string;
  /** Normalized to three positions, e.g. 001. */
  terminal: string;
  responseCode: string;
  transactionType: '0';
  authorized: boolean;
  raw: Readonly<Record<string, unknown>>;
}

export class RedsysValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'RedsysValidationError'; }
}

const MAX_ENCODED_LENGTH = 32_768;
const TEST_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';

function reject(message: string): never { throw new RedsysValidationError(message); }

function decodeBase64(value: string, label: string): Buffer {
  if (typeof value !== 'string' || !value || value.length > MAX_ENCODED_LENGTH ||
      !/^[A-Za-z0-9+/_-]+={0,2}$/.test(value) || value.replace(/=+$/, '').length % 4 === 1) {
    reject(label + ' no válido.');
  }
  const decoded = Buffer.from(value, 'base64');
  const canonical = value.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (decoded.toString('base64url') !== canonical) reject(label + ' no válido.');
  return decoded;
}

function validateSecret(secretKey: string) {
  // V2 uses the literal ASCII key from the bank: do NOT Base64-decode it.
  if (typeof secretKey !== 'string' || !/^[\x21-\x7e]{1,128}$/.test(secretKey)) reject('Configuración de firma no válida.');
}
function validateOfficialOrder(order: string) {
  // Redsys allows 4–12 ASCII alphanumeric positions; use its numeric-prefix recommendation.
  if (typeof order !== 'string' || !/^\d{4}[A-Za-z0-9]{0,8}$/.test(order)) reject('Pedido no válido.');
}
function validateSchoolOrder(order: string) {
  // The school chooses the narrower, unambiguous 12-digit order format.
  if (typeof order !== 'string' || !/^\d{12}$/.test(order)) reject('Pedido no válido.');
}
function terminalNumber(terminal: string): string {
  if (typeof terminal !== 'string' || !/^\d{1,3}$/.test(terminal) || Number(terminal) < 1) reject('Terminal no válido.');
  return terminal.padStart(3, '0');
}
function validateConfig(config: RedsysConfig) {
  if (!config || !/^\d{9}$/.test(config.merchantCode)) reject('Comercio no válido.');
  terminalNumber(config.terminal);
  validateSecret(config.secretKey);
  if (!['sandbox', 'production'].includes(config.environment)) reject('Entorno no válido.');
  if (config.environment === 'production' && config.secretKey.slice(0, 16) === TEST_KEY.slice(0, 16)) {
    reject('La clave pública de pruebas no se puede usar en producción.');
  }
}

function trustedOrigin(config: RedsysConfig): string {
  const configured = config.siteOrigin || (config.environment === 'production'
    ? 'https://www.elarbolquesuena.com' : 'http://127.0.0.1:4321');
  let origin: URL;
  try { origin = new URL(configured); } catch { return reject('Origen del sitio no válido.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      origin.search || origin.hash || origin.pathname !== '/' ||
      (config.environment === 'production' && origin.protocol !== 'https:')) {
    reject('Origen del sitio no válido.');
  }
  return origin.origin;
}
function callbackURL(value: string, origin: string): string {
  if (typeof value !== 'string' || value !== value.trim() || /[\u0000-\u001f\u007f]/.test(value)) reject('URL de retorno no válida.');
  let url: URL;
  try { url = new URL(value); } catch { return reject('URL de retorno no válida.'); }
  if (url.origin !== origin || url.username || url.password || url.hash || url.href.length > 250) {
    reject('URL de retorno no válida.');
  }
  return url.href;
}

/**
 * Pure signer, also exported to verify the official Redsys test vector.
 * AES-128-CBC uses PKCS#7 padding (Node's default), an all-zero IV, and the literal
 * key truncated/padded with ASCII "0" to 16 bytes. Its Base64 output is the TEXT
 * key for HMAC-SHA512 over the original encoded parameters. No network access.
 */
export function createSignature(secretKey: string, order: string, merchantParameters: string): string {
  validateSecret(secretKey);
  validateOfficialOrder(order);
  decodeBase64(merchantParameters, 'Parámetros');
  const key = Buffer.from(secretKey.slice(0, 16).padEnd(16, '0'), 'ascii');
  const cipher = createCipheriv('aes-128-cbc', key, Buffer.alloc(16));
  const diversified = Buffer.concat([cipher.update(order, 'utf8'), cipher.final()]).toString('base64');
  return createHmac('sha512', diversified).update(merchantParameters, 'utf8').digest('base64url');
}

/** Caller must obtain amount/order and all callback URLs from trusted server data. */
export function buildPaymentRequest(config: RedsysConfig, input: PaymentInput) {
  validateConfig(config);
  validateSchoolOrder(input.order);
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0 || input.amountCents > 999_999_999_999) {
    reject('Importe no válido.');
  }
  if (String(input.currency) !== '978') reject('Moneda no válida.');
  const origin = trustedOrigin(config);
  const payload = {
    DS_MERCHANT_ORDER: input.order,
    DS_MERCHANT_MERCHANTCODE: config.merchantCode,
    DS_MERCHANT_TERMINAL: terminalNumber(config.terminal),
    DS_MERCHANT_CURRENCY: '978',
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_AMOUNT: String(input.amountCents),
    DS_MERCHANT_MERCHANTURL: callbackURL(input.merchantURL, origin),
    DS_MERCHANT_URLOK: callbackURL(input.successURL, origin),
    DS_MERCHANT_URLKO: callbackURL(input.failureURL, origin),
  };
  const merchantParameters = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return {
    endpoint: REDSYS_ENDPOINTS[config.environment],
    signatureVersion: REDSYS_SIGNATURE_VERSION,
    merchantParameters,
    signature: createSignature(config.secretKey, input.order, merchantParameters),
  };
}

function notificationObject(paramsBase64: string): Record<string, unknown> {
  const bytes = decodeBase64(paramsBase64, 'Parámetros');
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { return reject('Parámetros no válidos.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) reject('Parámetros no válidos.');
  const entries = Object.entries(parsed);
  if (entries.length > 64) reject('Parámetros no válidos.');
  const fields: Record<string, unknown> = Object.create(null);
  for (const [key, value] of entries) {
    const normalized = key.toUpperCase();
    if (Object.hasOwn(fields, normalized) || ['__PROTO__', 'CONSTRUCTOR', 'PROTOTYPE'].includes(normalized)) reject('Parámetros ambiguos.');
    fields[normalized] = value;
  }
  return fields;
}
function fieldString(fields: Record<string, unknown>, name: string, pattern: RegExp): string {
  const value = fields[name];
  if (typeof value !== 'string' || !pattern.test(value)) reject('Notificación no válida.');
  return value;
}

/**
 * Authenticates the exact received Base64 string and validates sale notifications.
 * A valid signature is NOT payment reconciliation: the caller must still match
 * the stored pending order, expected amount/currency and process it atomically.
 */
export function verifyNotification(config: RedsysConfig, paramsBase64: string, signatureVersion: string, signature: string): VerifiedNotification {
  validateConfig(config);
  if (signatureVersion !== REDSYS_SIGNATURE_VERSION) reject('Versión de firma no admitida.');
  const fields = notificationObject(paramsBase64);
  const order = fieldString(fields, 'DS_ORDER', /^\d{12}$/);
  const received = decodeBase64(signature, 'Firma');
  if (received.byteLength !== 64) reject('Firma no válida.');
  const expected = Buffer.from(createSignature(config.secretKey, order, paramsBase64), 'base64url');
  if (!timingSafeEqual(expected, received)) reject('Firma no válida.');

  // All business fields are used only after signature verification.
  const merchantCode = fieldString(fields, 'DS_MERCHANTCODE', /^\d{9}$/);
  const terminal = terminalNumber(fieldString(fields, 'DS_TERMINAL', /^\d{1,3}$/));
  if (merchantCode !== config.merchantCode || terminal !== terminalNumber(config.terminal)) reject('Comercio o terminal no coincidente.');
  const amount = fieldString(fields, 'DS_AMOUNT', /^\d{1,12}$/);
  const amountCents = Number(amount);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) reject('Importe no válido.');
  const currencyValue = fieldString(fields, 'DS_CURRENCY', /^\d{3,4}$/);
  if (Number(currencyValue) !== 978) reject('Moneda no válida.');
  const responseCode = fieldString(fields, 'DS_RESPONSE', /^\d{1,4}$/).padStart(4, '0');
  const transactionType = fieldString(fields, 'DS_TRANSACTIONTYPE', /^0$/) as '0';
  return Object.freeze({
    order, amountCents, currency: '978' as const, merchantCode, terminal, responseCode,
    transactionType, authorized: Number(responseCode) < 100,
    raw: Object.freeze(fields),
  });
}
