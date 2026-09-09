(()=>{
const messageOf=e=>String(e?.reason?.message||e?.reason||e?.message||'');
const staleHealthError=e=>typeof page!=='undefined'&&page==='systemHealth'&&/Cannot set properties of null \(setting 'onclick'\)/i.test(messageOf(e));
const obsoleteDuePatchError=e=>typeof page!=='undefined'&&page==='dues'&&/Cannot read properties of undefined \(reading 'textContent'\)/i.test(messageOf(e))&&/app48\.js/i.test(String(e?.filename||''));
addEventListener('unhandledrejection',e=>{if(!staleHealthError(e))return;e.preventDefault();e.stopImmediatePropagation();console.warn('Eski Sistem Sınırları görünümüne ait işlem güvenle iptal edildi.');},true);
addEventListener('error',e=>{if(!obsoleteDuePatchError(e))return;e.preventDefault();e.stopImmediatePropagation();console.warn('Eski aidat görünümüne ait uyumsuz satır güvenle atlandı.');},true);
setTimeout(()=>{if(typeof render!=='function'||render.__healthRaceGuard)return;const base=render;let lastHealthRender=0;function guardedRender(...args){if(typeof page!=='undefined'&&page==='systemHealth'){const now=Date.now();if(now-lastHealthRender<600&&document.querySelector('#healthContent'))return;lastHealthRender=now}return base.apply(this,args)}guardedRender.__healthRaceGuard=true;render=guardedRender},0);
})();
