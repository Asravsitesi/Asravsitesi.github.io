(()=>{
const staleHealthError=e=>{const m=String(e?.reason?.message||e?.reason||'');return typeof page!=='undefined'&&page==='systemHealth'&&/Cannot set properties of null \(setting 'onclick'\)/i.test(m)};
addEventListener('unhandledrejection',e=>{if(!staleHealthError(e))return;e.preventDefault();e.stopImmediatePropagation();console.warn('Eski Sistem Sınırları görünümüne ait işlem güvenle iptal edildi.');},true);
setTimeout(()=>{if(typeof render!=='function'||render.__healthRaceGuard)return;const base=render;let lastHealthRender=0;function guardedRender(...args){if(typeof page!=='undefined'&&page==='systemHealth'){const now=Date.now();if(now-lastHealthRender<600&&document.querySelector('#healthContent'))return;lastHealthRender=now}return base.apply(this,args)}guardedRender.__healthRaceGuard=true;render=guardedRender},0);
})();
