// Production HTTP boundary checks. Does not use real keys or send email.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { auditNavigation } from './navigation.audit.mjs';
const port='4387';
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['dist/server/entry.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:port,LEGAL_READY:'false',SEO_INDEXING_ENABLED:'false',PUBLIC_SUPABASE_URL:'',PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',RESEND_API_KEY:''},stdio:['ignore','pipe','pipe']});
let log=''; server.stdout.on('data',chunk=>log+=chunk);server.stderr.on('data',chunk=>log+=chunk);
let checks=0;
try {
  let ready=false;
  for(let i=0;i<80;i++){try{const response=await fetch(base);if(response.ok){ready=true;break;}}catch{}await delay(150);}
  assert.ok(ready,`Server did not start: ${log}`);
  for(const path of ['/','/registro','/programa','/login','/metodologia','/escuela-internacional-neuroeducacion-musical','/contacto','/privacidad']) {
    const response=await fetch(base+path);assert.equal(response.status,200,path);assert.ok((await response.text()).includes('El Árbol'));checks++;
  }
  for(const path of ['/dashboard','/modulos/1','/examen/1','/foro','/trabajo-final','/certificado','/tutorias','/admin','/mi-solicitud']) {
    const response=await fetch(base+path,{redirect:'manual'});assert.equal(response.status,303,path);assert.ok(response.headers.get('location').startsWith('/login?next='));assert.equal(response.headers.get('cache-control'),'private, no-store');checks++;
  }
  for(const path of ['/vista-previa','/vista-previa/aula','/vista-previa/cuestionario','/vista-previa/administracion']) {
    const preview=await fetch(base+path);assert.equal(preview.status,404,path);assert.ok(!(await preview.text()).includes('Docente de ejemplo'));checks++;
  }
  const status=await (await fetch(base+'/api/launch/status')).json();assert.equal(status.paymentsEnabled,false);assert.equal(status.applicationsOpen,false);checks++;
  for(const route of ['/api/materials/11111111-1111-4111-8111-111111111111','/api/submissions/11111111-1111-4111-8111-111111111111']) {
    const response=await fetch(base+route,{redirect:'manual'});assert.equal(response.status,401);checks++;
  }
  const application=await fetch(base+'/api/applications',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({full_name:'Persona de prueba',email:'test@example.invalid',privacy:'on'}),redirect:'manual'});
  assert.equal(application.status,303);assert.equal(application.headers.get('location'),'/registro?error=unavailable');checks++;
  const signup=await fetch(base+'/api/newsletter/subscribe',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:'test@example.invalid',consent:'on'}),redirect:'manual'});
  assert.equal(signup.status,303);assert.ok(signup.headers.get('location').includes('newsletter=error'));checks++;
  for (const source of ['footer', 'https://evil.invalid/#newsletter']) {
    const result=await fetch(base+'/api/newsletter/subscribe',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:'test@example.invalid',consent:'on',source}),redirect:'manual'});
    assert.equal(result.status,303);
    const target=new URL(result.headers.get('location'),base);
    assert.equal(target.origin,base);
    assert.equal(target.hash,source==='footer'?'#newsletter-footer':'#newsletter');
    assert.equal(target.searchParams.get('newsletter_source'),source==='footer'?'footer':'home');
    assert.equal(target.searchParams.get('newsletter'),'error');checks++;
  }
  const malicious=await fetch(base+'/api/admin/action',{method:'POST',headers:{Origin:'https://evil.invalid','Content-Type':'application/x-www-form-urlencoded'},body:'action=issue_certificate',redirect:'manual'});
  assert.equal(malicious.status,403);checks++;
  const home=await fetch(base);assert.ok(home.headers.get('content-security-policy').includes("frame-ancestors 'none'"));assert.equal(home.headers.get('x-content-type-options'),'nosniff');checks++;
  const publicDescriptions=new Set();
  for (const path of ['/','/programa','/escuela-internacional-neuroeducacion-musical','/metodologia','/contacto']) {
    const response=await fetch(base+path+'?utm_source=ensayo');
    const html=await response.text();
    assert.ok(html.includes(`rel="canonical" href="https://www.elarbolquesuena.com${path==='/'?'/':path}"`),path);
    assert.match(response.headers.get('x-robots-tag'),/noindex/);
    assert.match(html,/<meta name="robots" content="noindex, follow"/);
    assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,path);
    const description=html.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(!publicDescriptions.has(description),'Repeated public description');publicDescriptions.add(description);
    const schema=JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.ok(schema['@graph'].some(entity=>entity['@type']==='EducationalOrganization'));
    if(path==='/programa') assert.ok(schema['@graph'].some(entity=>entity['@type']==='Course'));
    checks++;
  }
  for (const path of ['/login','/registro','/newsletter/confirmar','/blog']) {
    const response=await fetch(base+path);assert.match(await response.text(),/<meta name="robots" content="noindex, follow"/);
    if(path==='/newsletter/confirmar') assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
    checks++;
  }
  const robots=await fetch(base+'/robots.txt');assert.equal(robots.status,200);assert.match(robots.headers.get('content-type'),/text\/plain/);assert.match(await robots.text(),/Allow: \//);checks++;
  const sitemap=await fetch(base+'/sitemap.xml');assert.equal(sitemap.status,200);assert.match(sitemap.headers.get('content-type'),/application\/xml/);assert.ok(!(await sitemap.text()).includes('<loc>'),'Preview sitemap must stay empty');checks++;
  const trailing=await fetch(base+'/programa/',{redirect:'manual'});assert.equal(trailing.status,301);assert.equal(trailing.headers.get('location'),'/programa');checks++;
  const alias=await fetch(base+'/curso-neuroeducacion-musical-docentes-0-9',{redirect:'manual'});assert.equal(alias.status,301);assert.equal(alias.headers.get('location'),'/programa');checks++;
  for (const path of ['/azahara-mateos', '/azahara-mateos/?utm_source=ensayo']) {
    const oldSchool=await fetch(base+path,{redirect:'manual'});
    assert.equal(oldSchool.status,301,path);
    assert.equal(oldSchool.headers.get('location'),'/escuela-internacional-neuroeducacion-musical'+new URL(path,base).search);
    checks++;
  }
  const missing=await fetch(base+'/no-existe-ensayo');assert.equal(missing.status,404);assert.match(missing.headers.get('x-robots-tag'),/noindex/);checks++;
  const navigation = await auditNavigation(base);
  console.log(`${checks} production HTTP checks passed; ${navigation.links} internal destinations and anchors across ${navigation.pages} pages/states checked. ${navigation.external.length} external reference(s) listed for separate review. No configured services and no payments.`);
} finally {server.kill();}
