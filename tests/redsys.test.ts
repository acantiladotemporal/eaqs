import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPaymentRequest, createSignature, verifyNotification, REDSYS_SIGNATURE_VERSION, REDSYS_ENDPOINTS, type RedsysConfig, type PaymentInput } from '../src/lib/server/redsys';

// Public key and vector explicitly published by Redsys, never a school credential.
// https://pagosonline.redsys.es/desarrolladores-inicio/documentacion-operativa/firmar-una-operacion/
const PUBLIC_TEST_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
const OFFICIAL_PARAMETERS = 'eyJEU19NRVJDSEFOVF9BTU9VTlQiOiI5OTkiLCJEU19NRVJDSEFOVF9PUkRFUiI6IjEyMzQ1Njc4OTAiLCJEU19NRVJDSEFOVF9NRVJDSEFOVENPREUiOiI5OTkwMDg4ODEiLCJEU19NRVJDSEFOVF9DVVJSRU5DWSI6Ijk3OCIsIkRTX01FUkNIQU5UX1RSQU5TQUNUSU9OVFlQRSI6IjAiLCJEU19NRVJDSEFOVF9URVJNSU5BTCI6IjEiLCJEU19NRVJDSEFOVF9NRVJDSEFOVFVSTCI6Imh0dHA6XC9cL3d3dy5wcnVlYmEuY29tXC91cmxOb3RpZmljYWNpb24ucGhwIiwiRFNfTUVSQ0hBTlRfVVJMT0siOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsT0sucGhwIiwiRFNfTUVSQ0hBTlRfVVJMS08iOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsS08ucGhwIn0';
const OFFICIAL_SIGNATURE = 'Vjo02eSWq249IeZZp3R-ArFnGLhKY0OuzDDlx1BuVtZDC2yhczA7_11uZhsYzLZBCMFAz8u8uzGDX3AErHKmmw';
const config: RedsysConfig = {merchantCode:'999008881', terminal:'001', secretKey:PUBLIC_TEST_KEY, environment:'sandbox', siteOrigin:'https://school.test'};
const input: PaymentInput = {order:'202611010001', amountCents:39000, currency:'978', merchantURL:'https://school.test/api/payments/notification',successURL:'https://school.test/matricula/resultado',failureURL:'https://school.test/matricula/resultado'};
const fixture = {Ds_Order:input.order,Ds_Amount:'39000',Ds_Currency:'978',Ds_MerchantCode:config.merchantCode,Ds_Terminal:'1',Ds_Response:'0000',Ds_TransactionType:'0'};
function signed(fields: Record<string, unknown>, encoding: 'base64'|'base64url' = 'base64url') {
  const params = Buffer.from(JSON.stringify(fields)).toString(encoding);
  return {params, signature:createSignature(config.secretKey,String(fields.Ds_Order || fields.DS_ORDER),params)};
}

test('signature matches the published Redsys HMAC_SHA512_V2 interoperability vector',()=>{
  assert.equal(createSignature(PUBLIC_TEST_KEY,'1234567890',OFFICIAL_PARAMETERS),OFFICIAL_SIGNATURE);
});
test('payment request uses hosted sandbox and integer cents without exposing a key',()=>{
  const request=buildPaymentRequest(config,input);
  assert.equal(request.endpoint,REDSYS_ENDPOINTS.sandbox);
  assert.equal(request.signatureVersion,REDSYS_SIGNATURE_VERSION);
  const payload=JSON.parse(Buffer.from(request.merchantParameters,'base64url').toString());
  assert.equal(payload.DS_MERCHANT_AMOUNT,'39000');
  assert.equal(payload.DS_MERCHANT_CURRENCY,'978');
  assert.equal(payload.DS_MERCHANT_TRANSACTIONTYPE,'0');
  assert.equal(payload.DS_MERCHANT_TERMINAL,'001');
  assert.equal(payload.DS_MERCHANT_MERCHANTURL,input.merchantURL);
  assert.equal(JSON.stringify(request).includes(PUBLIC_TEST_KEY),false);
});
test('requests reject invalid amount, order, currency and configuration',()=>{
  for(const amountCents of [0,-1,39.5,NaN,Infinity,1_000_000_000_000])assert.throws(()=>buildPaymentRequest(config,{...input,amountCents}));
  for(const order of ['20261101000','2026110100001','ABCD11010001','20261101a001','20261101 001'])assert.throws(()=>buildPaymentRequest(config,{...input,order}));
  assert.throws(()=>buildPaymentRequest(config,{...input,currency:'840' as '978'}));
  assert.throws(()=>buildPaymentRequest({...config,merchantCode:'bad'},input));
  assert.throws(()=>buildPaymentRequest({...config,terminal:'000'},input));
  assert.throws(()=>buildPaymentRequest({...config,secretKey:''},input));
  assert.throws(()=>buildPaymentRequest({...config,environment:'production'},input),'public test key must never be accepted for production');
});
test('callback URLs must remain on a trusted server origin',()=>{
  for(const url of ['https://evil.test/callback','//school.test/callback','javascript:alert(1)','https://school.test@evil.test/callback','https://school.test/path#fragment',' https://school.test/path']){
    assert.throws(()=>buildPaymentRequest(config,{...input,merchantURL:url}));
    assert.throws(()=>buildPaymentRequest(config,{...input,successURL:url}));
    assert.throws(()=>buildPaymentRequest(config,{...input,failureURL:url}));
  }
  const production={...config,environment:'production' as const,secretKey:'NotARealSchoolSecretForTests',siteOrigin:'http://school.test'};
  assert.throws(()=>buildPaymentRequest(production,{...input,merchantURL:'http://school.test/a',successURL:'http://school.test/b',failureURL:'http://school.test/c'}));
});
test('authenticated notification normalizes terminal and returns signed sale fields',()=>{
  for(const encoding of ['base64','base64url'] as const){
    const {params,signature}=signed(fixture,encoding);
    const result=verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,signature);
    assert.equal(result.order,input.order);assert.equal(result.amountCents,39000);assert.equal(result.currency,'978');
    assert.equal(result.terminal,'001');assert.equal(result.merchantCode,config.merchantCode);assert.equal(result.authorized,true);
  }
});
test('a signed decline is never reported as an authorized sale',()=>{
  for(const response of ['0101','0190','9915','9998']){
    const {params,signature}=signed({...fixture,Ds_Response:response});
    assert.equal(verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,signature).authorized,false);
  }
});
test('signature rejects tampered amounts, changed orders and changed signatures',()=>{
  const {params,signature}=signed(fixture);
  const changed=Buffer.from(JSON.stringify({...fixture,Ds_Amount:'1'})).toString('base64url');
  assert.throws(()=>verifyNotification(config,changed,REDSYS_SIGNATURE_VERSION,signature));
  const changedOrder=Buffer.from(JSON.stringify({...fixture,Ds_Order:'202611010002'})).toString('base64url');
  assert.throws(()=>verifyNotification(config,changedOrder,REDSYS_SIGNATURE_VERSION,signature));
  const changedSignature=(signature[0]==='A'?'B':'A')+signature.slice(1);
  assert.throws(()=>verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,changedSignature));
  assert.throws(()=>verifyNotification(config,params,'HMAC_SHA256_V1',signature));
});
test('valid signatures do not bypass semantic checks',()=>{
  for(const patch of [
    {Ds_MerchantCode:'123456789'},{Ds_Terminal:'2'},{Ds_Amount:'-1'},{Ds_Amount:'390.00'},
    {Ds_Currency:'840'},{Ds_Response:'OK'},{Ds_TransactionType:'3'},{Ds_Amount:39000},
  ]){
    const {params,signature}=signed({...fixture,...patch});
    assert.throws(()=>verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,signature));
  }
  const {params,signature}=signed({...fixture,DS_AMOUNT:'1'});
  assert.throws(()=>verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,signature),'case-ambiguous parameters must be rejected');
});
test('malformed and oversized notifications fail closed',()=>{
  for(const params of ['','not json','====','A','a'.repeat(40_000),Buffer.from('[]').toString('base64url'),Buffer.from('null').toString('base64url')]){
    assert.throws(()=>verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,'abc'));
  }
  const {params}=signed(fixture);
  for(const signature of ['','abc','!'.repeat(86),'A'.repeat(200)])assert.throws(()=>verifyNotification(config,params,REDSYS_SIGNATURE_VERSION,signature));
});
