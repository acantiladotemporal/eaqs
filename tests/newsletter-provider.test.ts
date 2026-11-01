import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { reconcileContact, ResendContactsProvider, verifyNewsletterWebhook, unsubscribeEvent, limitedWebhookBody, syncNewsletterSubscriber } from '../src/lib/server/newsletter-provider';
import type { ContactsProvider, ProviderContact } from '../src/lib/server/newsletter-provider';
import type { SupabaseClient } from '@supabase/supabase-js';

const contact: ProviderContact = { id: 'contact-1', email: 'docente@example.com', unsubscribed: false };
function provider(existing: ProviderContact | null) {
  const calls: string[] = [];
  const api: ContactsProvider = {
    async get() { calls.push('get'); return existing; },
    async create() { calls.push('create'); return contact; },
    async unsubscribe() { calls.push('unsubscribe'); },
  };
  return { api, calls };
}

test('pending confirmation never creates or activates a provider contact', async () => {
  const { api, calls } = provider(null);
  assert.deepEqual(await reconcileContact({email: contact.email, status:'pending'}, api), {outcome:'pending'});
  assert.deepEqual(calls, []);
});

test('only a confirmed, first-time contact is created', async () => {
  const { api, calls } = provider(null);
  assert.deepEqual(await reconcileContact({email:contact.email,status:'confirmed'},api),{outcome:'synced',contactId:'contact-1'});
  assert.deepEqual(calls,['get','create']);
});

test('an existing provider unsubscribe is never reversed by retry', async () => {
  const { api, calls } = provider({...contact,unsubscribed:true});
  assert.deepEqual(await reconcileContact({email:contact.email,status:'confirmed'},api),{outcome:'remote_unsubscribed',contactId:'contact-1'});
  assert.deepEqual(calls,['get']);
});

test('a provider-deleted contact with a stored identity is not recreated', async () => {
  const { api, calls } = provider(null);
  assert.deepEqual(await reconcileContact({email:contact.email,status:'confirmed',provider_contact_id:'old-contact'},api),{outcome:'remote_unsubscribed',contactId:'old-contact'});
  assert.deepEqual(calls,['get']);
});

test('a local unsubscribe deactivates an active provider contact, never creates one', async () => {
  const first=provider(contact);
  assert.deepEqual(await reconcileContact({email:contact.email,status:'unsubscribed'},first.api),{outcome:'synced',contactId:'contact-1'});
  assert.deepEqual(first.calls,['get','unsubscribe']);
  const missing=provider(null);
  assert.deepEqual(await reconcileContact({email:contact.email,status:'unsubscribed'},missing.api),{outcome:'synced'});
  assert.deepEqual(missing.calls,['get']);
});

test('provider HTTP failures are propagated without treating them as a missing contact', async () => {
  const requests: RequestInit[]=[];
  const fakeFetch:typeof fetch=async (_url,init)=>{requests.push(init!);return new Response('{}',{status:500});};
  const api=new ResendContactsProvider('not-a-real-key',fakeFetch);
  await assert.rejects(api.get(contact.email),{status:503});
  assert.equal(requests.length,1);
});

test('provider unsubscribe only PATCHes true and checks returned contact identity', async () => {
  const requests:{url:string;init:RequestInit}[]=[];
  const fakeFetch:typeof fetch=async (url,init)=>{
    requests.push({url:String(url),init:init!});
    return new Response(JSON.stringify(init?.method==='GET'?contact:{id:contact.id}),{status:200});
  };
  const api=new ResendContactsProvider('not-a-real-key',fakeFetch);
  const found=await api.get('DOCENTE@example.com');
  assert.deepEqual(found,contact);
  await api.unsubscribe(found!);
  assert.equal(requests[0].url,'https://api.resend.com/contacts/docente%40example.com');
  assert.equal(requests[1].init.method,'PATCH');
  assert.deepEqual(JSON.parse(String(requests[1].init.body)),{unsubscribed:true});
});

const secret='whsec_'+Buffer.from('only-a-fake-test-secret').toString('base64');
function signatureHeaders(payload:string,seconds=Math.floor(Date.now()/1000)) {
  const id='msg_test_event';
  const signature=createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${id}.${seconds}.${payload}`).digest('base64');
  return new Headers({'svix-id':id,'svix-timestamp':String(seconds),'svix-signature':`v1,${signature}`});
}
const payload=()=>JSON.stringify({type:'contact.updated',created_at:new Date().toISOString(),data:{...contact,unsubscribed:true}});

test('Svix accepts authentic raw payload and rejects a changed body or invalid signature', () => {
  const raw=payload();const headers=signatureHeaders(raw);
  const verified=verifyNewsletterWebhook(raw,headers,secret);
  assert.equal(unsubscribeEvent(verified)?.email,contact.email);
  assert.throws(()=>verifyNewsletterWebhook(raw+' ',headers,secret),{status:400});
  headers.set('svix-signature','v1,invalid');
  assert.throws(()=>verifyNewsletterWebhook(raw,headers,secret),{status:400});
});

test('Svix rejects stale, future and missing signature metadata', () => {
  const raw=payload();
  assert.throws(()=>verifyNewsletterWebhook(raw,signatureHeaders(raw,Math.floor(Date.now()/1000)-3600),secret),{status:400});
  assert.throws(()=>verifyNewsletterWebhook(raw,signatureHeaders(raw,Math.floor(Date.now()/1000)+3600),secret),{status:400});
  assert.throws(()=>verifyNewsletterWebhook(raw,new Headers(),secret),{status:400});
});

test('provider events cannot confirm or reactivate a local subscription', () => {
  assert.equal(unsubscribeEvent({type:'contact.updated',data:{...contact,unsubscribed:false}}),null);
  assert.equal(unsubscribeEvent({type:'email.sent'}),null);
  assert.throws(()=>unsubscribeEvent({type:'contact.updated',created_at:'invalid',data:{...contact,unsubscribed:true}}),{status:400});
});

test('webhook body size is enforced with and without a Content-Length header',async()=>{
  const tooLarge='x'.repeat(131073);
  await assert.rejects(limitedWebhookBody(new Request('https://example.invalid',{method:'POST',body:tooLarge})),{status:413});
  await assert.rejects(limitedWebhookBody(new Request('https://example.invalid',{method:'POST',body:'{}',headers:{'content-length':'200000'}})),{status:413});
  assert.equal(await limitedWebhookBody(new Request('https://example.invalid',{method:'POST',body:'{"a":1}'})),'{"a":1}');
});

test('disabled marketing retains an auditable pending sync without any provider call', async () => {
  const old = process.env.NEWSLETTER_MARKETING_ENABLED;
  process.env.NEWSLETTER_MARKETING_ENABLED = 'false';
  const writes: Record<string, unknown>[] = [];
  let update: Record<string, unknown> | null = null;
  const row = {id:'subscriber-1',email:contact.email,status:'confirmed',subscription_version:'version-1',provider_contact_id:null,unsubscribed_at:null};
  const chain = {
    select() { return chain; }, eq() { return chain; },
    update(payload: Record<string, unknown>) { update=payload;writes.push(payload);return chain; },
    async maybeSingle() { return {data:update?{id:row.id}:row,error:null}; },
  };
  const service = {from(){return chain;}} as unknown as SupabaseClient;
  try {
    assert.equal(await syncNewsletterSubscriber(row.id,service),false);
    assert.equal(writes[0].provider_sync_status,'pending');
    assert.equal(writes[0].provider_synced_at,null);
  } finally { old===undefined?delete process.env.NEWSLETTER_MARKETING_ENABLED:process.env.NEWSLETTER_MARKETING_ENABLED=old; }
});
