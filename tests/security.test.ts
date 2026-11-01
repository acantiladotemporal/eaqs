import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNext,emailAddress,escapeHtml,formData,HttpError } from '../src/lib/server/security';
import { userIsAdmin } from '../src/lib/server/auth';
import type { User } from '@supabase/supabase-js';

test('return paths cannot redirect to another origin',()=>{
  for(const path of ['https://evil.test','//evil.test','/\\evil.test','/\nLocation:evil.test','javascript:alert(1)'])assert.equal(safeNext(path),'/mi-solicitud');
  assert.equal(safeNext('/admin?tab=solicitudes'),'/admin?tab=solicitudes');
});
test('only trusted app metadata grants administration',()=>{
  const user={email_confirmed_at:new Date().toISOString(),user_metadata:{role:'admin'},app_metadata:{}} as unknown as User;
  assert.equal(userIsAdmin(user),false);
  user.app_metadata.role='admin'; assert.equal(userIsAdmin(user),true);
  user.email_confirmed_at=undefined;assert.equal(userIsAdmin(user),false);
});
test('emails are normalized and HTML characters escaped',()=>{
  assert.equal(emailAddress(' Docente@Example.org '),'docente@example.org');
  assert.throws(()=>emailAddress('a\r\nb@example.org'));
  assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
test('mutation forms reject foreign or missing origins',async()=>{
  for(const origin of ['https://evil.test','']) {
    const request=new Request('https://school.test/api/applications',{method:'POST',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:'email=a%40example.org'});
    await assert.rejects(formData({request,url:new URL(request.url)}),error=>error instanceof HttpError && error.status===403);
  }
});
test('forms are parsed with a bounded request body',async()=>{
  const request=new Request('https://school.test/api/applications',{method:'POST',headers:{origin:'https://school.test','Content-Type':'application/x-www-form-urlencoded'},body:'email=a%40example.org'});
  assert.equal((await formData({request,url:new URL(request.url)})).get('email'),'a@example.org');
  const large=new Request('https://school.test/api/applications',{method:'POST',headers:{origin:'https://school.test','Content-Type':'application/x-www-form-urlencoded'},body:'a'.repeat(11_000_001)});
  await assert.rejects(formData({request:large,url:new URL(large.url)}),error=>error instanceof HttpError && error.status===413);
});
