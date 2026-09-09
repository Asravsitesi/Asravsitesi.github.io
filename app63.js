(()=>{
const app=$('#app'),nav=$('#mobileAppNav'),shade=$('#mobileDrawerShade'),sidebar=$('#sidebar');
function closeDrawer(){sidebar?.classList.remove('open');shade?.classList.remove('show');document.body.classList.remove('mobile-drawer-open');$('#menuBtn')?.setAttribute('aria-expanded','false')}
function syncAuthChrome(){const signedIn=app&&!app.classList.contains('hidden');nav?.classList.toggle('session-hidden',!signedIn);if(!signedIn)closeDrawer()}
if(app)new MutationObserver(syncAuthChrome).observe(app,{attributes:true,attributeFilter:['class']});syncAuthChrome();
const baseNavigate=navigate;navigate=function(...args){const r=baseNavigate.apply(this,args);if(innerWidth<=760)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));return r};
function viewport(){document.documentElement.style.setProperty('--asrav-vh',`${window.innerHeight}px`)}viewport();addEventListener('resize',viewport,{passive:true});
const style=document.createElement('style');style.textContent=`.mobile-app-nav.session-hidden{display:none!important}@media(max-width:760px){html,body{min-height:var(--asrav-vh,100dvh)!important}.main,#app{min-height:var(--asrav-vh,100dvh)!important}.content{padding-bottom:calc(30px + var(--mobile-nav-h) + env(safe-area-inset-bottom))!important}.sidebar{height:var(--asrav-vh,100dvh)!important;max-height:var(--asrav-vh,100dvh)!important}.sidebar.open{overflow-y:auto!important}.due-toolbar+.panel{margin-bottom:16px}.due-toolbar+.panel .table-wrap{min-height:1px!important}.mobile-app-nav.session-hidden+.mobile-drawer-shade{display:none!important}}`;document.head.appendChild(style);
})();
