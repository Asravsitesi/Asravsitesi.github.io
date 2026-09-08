const SUPABASE_URL='https://lgbslyeqxtpawamhwqnl.supabase.co';
const SUPABASE_KEY='sb_publishable_K_aAP-xjL2lv00fo9oCcjQ_lgjbXUyi';
const AUTH_REDIRECT='https://asravsitesi.github.io/';
const authSearch=new URLSearchParams(location.search),authHash=new URLSearchParams(location.hash.slice(1));
const authError=authSearch.get('error_description')||authHash.get('error_description')||authSearch.get('error')||authHash.get('error');
const authErrorCode=authSearch.get('error_code')||authHash.get('error_code');
const authType=authSearch.get('type')||authHash.get('type');
const authCallbackSuccess=!authError&&(authType==='signup'||authSearch.has('code')||authHash.has('access_token'));
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let signup=false,page='dashboard',session=null,profile=null,data={units:[],profiles:[],dues:[],budgets:[],announcements:[],documents:[],rolePermissions:[]},channel,permissionMap={};
const SITE='00000000-0000-0000-0000-000000000001';
const roles={admin:'Admin',manager:'Yönetici',owner:'Ev Sahibi',tenant:'Kiracı',resident:'Atama Bekliyor'};
const statusNames={paid:'Ödendi',unpaid:'Ödenmedi',pending:'Bekliyor'};
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(+n||0);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function toast(t,type='success',ms=4200){const e=$('#toast');e.textContent=t;e.style.background=type==='error'?'#8f2d2d':'';e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),ms)}
function badge(s){return `<span class="badge ${s==='paid'?'paid':s==='unpaid'?'unpaid':'pending'}">${statusNames[s]||s}</span>`}
function unit(id){return data.units.find(x=>x.id==id)?.label||'Daire atanmamış'}
function occupant(id){return data.profiles.find(x=>x.unit_id==id)||{full_name:'Atama bekleniyor',email:'',phone:''}}
function has(key){return profile?.role==='admin'||!!permissionMap[profile?.role]?.[key]}
function isManager(){return has('dues_manage')||has('budgets_manage')||has('documents_manage')||has('announcements_manage')}
const pagePermissions={dashboard:'dashboard',dues:'dues_view',budgets:'budgets_view',docs:'documents_view',notices:'announcements_view'};
function canOpenPage(next){return next==='settings'||(next==='admin'&&profile?.role==='admin')||!!pagePermissions[next]&&has(pagePermissions[next])}
function navigate(next,push=true){if(!canOpenPage(next))next='dashboard';page=next;$$('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));$('#sidebar').classList.remove('open');if(push&&location.hash!=='#'+page)history.pushState({page},'',location.pathname+location.search+'#'+page);render()}
function fileType(d){const ext=(d.name||'').split('.').pop();return ext&&ext!==d.name?ext.slice(0,4).toUpperCase():'DOSYA'}
function applyAccess(){document.body.dataset.device=innerWidth<761?'mobile':innerWidth<1051?'tablet':'desktop';$$('[data-perm]').forEach(x=>x.classList.toggle('hidden',!has(x.dataset.perm)));$$('.admin-only').forEach(x=>x.classList.toggle('hidden',profile?.role!=='admin'))}
addEventListener('resize',()=>{document.body.dataset.device=innerWidth<761?'mobile':innerWidth<1051?'tablet':'desktop'});
function setAuthMode(v){signup=v;$('#nameField').classList.toggle('hidden',!v);$('#loginTitle').textContent=v?'Yeni hesap oluşturun':'Hesabınıza giriş yapın';$('#loginSub').textContent=v?'Bilgilerinizi girin; yönetici dairenizi atayacaktır.':'Asrav Sitesi ortak yönetim sistemine devam edin.';$('#authSubmit').textContent=v?'Hesap oluştur':'Giriş yap';$('#authToggle').textContent=v?'Zaten hesabım var':'Yeni hesap oluştur';$('#loginPass').autocomplete=v?'new-password':'current-password'}
$('#authToggle').onclick=()=>setAuthMode(!signup);
$('#loginForm').onsubmit=async e=>{e.preventDefault();const email=$('#loginEmail').value.trim(),password=$('#loginPass').value,name=$('#loginName').value.trim();$('#authSubmit').disabled=true;let error;if(signup){({error}=await db.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:AUTH_REDIRECT}}));if(!error){toast('Hesap oluşturuldu. E-postanızı doğrulayın.');setAuthMode(false)}}else({error}=await db.auth.signInWithPassword({email,password}));$('#authSubmit').disabled=false;if(error)toast(error.message)};
$('#logout').onclick=()=>db.auth.signOut();$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;e.preventDefault();navigate(b.dataset.page)});addEventListener('popstate',()=>navigate(location.hash.slice(1)||'dashboard',false));
async function boot(s){session=s;if(!s){$('#login').classList.remove('hidden');$('#app').classList.add('hidden');return}$('#login').classList.add('hidden');$('#app').classList.remove('hidden');await loadAll();subscribe()}
async function loadAll(){try{const uid=session.user.id;let {data:p,error}=await db.from('profiles').select('*').eq('id',uid).single();if(error)throw error;profile=p;const queries=[db.from('units').select('*').order('id'),db.from('profiles').select('*').order('full_name'),db.from('dues').select('*').order('period',{ascending:false}),db.from('budgets').select('*').order('year',{ascending:false}),db.from('announcements').select('*').order('created_at',{ascending:false}),db.from('documents').select('*').order('created_at',{ascending:false}),db.from('role_permissions').select('*')];const r=await Promise.all(queries);['units','profiles','dues','budgets','announcements','documents','rolePermissions'].forEach((k,i)=>{if(r[i].error)throw r[i].error;data[k]=r[i].data||[]});permissionMap=Object.fromEntries(data.rolePermissions.map(x=>[x.role,x.permissions||{}]));const requested=location.hash.slice(1);if(canOpenPage(requested))page=requested;$('#userName').textContent=profile.full_name||session.user.email;$('#userRole').textContent=roles[profile.role]+' · '+unit(profile.unit_id);$('#avatar').textContent=(profile.full_name||'AS').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();applyAccess();$('#syncStatus').textContent='● Güncel';$('#syncStatus').className='tag green';render()}catch(e){console.error(e);toast('Veriler yüklenemedi: '+e.message)}}
function subscribe(){if(channel)db.removeChannel(channel);channel=db.channel('asrav-live').on('postgres_changes',{event:'*',schema:'public'},()=>loadAll()).subscribe(s=>{if(s==='SUBSCRIBED')$('#syncStatus').textContent='● Canlı'})}
