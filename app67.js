(()=>{
  function removeBuildBadge(){
    if(page!=='systemHealth')return;
    $$('#content .toolbar .tag').forEach(x=>{if(/^build\s+\d+/i.test(x.textContent.trim()))x.remove()});
  }

  function contactPhone(p){
    return normalizeContactPhone(p?.phone)||normalizeContactPhone(p?.phone_secondary)||'';
  }
  function launchExternal(url){
    const w=window.open(url,'_blank','noopener,noreferrer');
    if(!w)setTimeout(()=>{window.location.href=url},30);
  }
  function notificationLog(id,p,channel){
    if(!p?.id)return Promise.resolve();
    return db.from('notification_logs').insert({site_id:SITE,due_id:id,recipient_profile_id:p.id,channel,sent_by:profile.id});
  }

  remind=function(id){
    const d=(data.dues||[]).find(x=>x.id===Number(id));
    if(!d)return toast('Aidat kaydı bulunamadı.','error');
    const p=occupant(d.unit_id)||{},phone=contactPhone(p),email=(p.email||'').trim();
    const currentPaid=d.current_due_paid===true||(d.current_due_paid==null&&d.status==='paid');
    const oldTotal=Math.max(0,Number(d.previous_debt)||0);
    const oldPaid=Math.max(0,Math.min(oldTotal,d.previous_debt_paid_amount==null?(d.previous_debt_paid?oldTotal:0):Number(d.previous_debt_paid_amount)||0));
    const total=(currentPaid?0:Math.max(0,Number(d.amount)||0))+Math.max(0,oldTotal-oldPaid);
    const period=new Date(String(d.period).slice(0,10)+'T12:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
    const dueDate=d.due_date?new Date(String(d.due_date).slice(0,10)+'T12:00:00').toLocaleDateString('tr-TR'):'belirtilmedi';
    const text=`Merhaba ${p.full_name||'Site Sakini'}, ${period} dönemine ait toplam ${money(total)} borcunuz ödenmemiş görünüyor. Son ödeme: ${dueDate}. Asrav Sitesi Yönetimi`;
    $('#modalRoot').innerHTML=`<div class="modal-backdrop reminder-backdrop"><div class="modal reminder-modal"><div class="modal-head"><div><h3>Aidat Hatırlatması</h3><small>${esc(unit(d.unit_id))} · ${esc(p.full_name||'Sakin atanmamış')}</small></div><button class="close" data-close aria-label="Kapat">×</button></div><div class="modal-body"><div class="reminder-recipient"><span><b>E-posta</b>${esc(email||'Kayıtlı değil')}</span><span><b>Telefon</b>${esc(phone||'Kayıtlı değil')}</span></div><div class="field"><label>Gönderilecek mesaj</label><textarea id="msg" maxlength="1000">${esc(text)}</textarea></div><div class="reminder-actions" aria-label="Hatırlatma kanalları"><button class="reminder-channel mail" id="mail" type="button"><span>✉</span><b>E-posta</b><small>Mail uygulamasını aç</small></button><button class="reminder-channel sms" id="sms" type="button"><span>▣</span><b>SMS</b><small>Mesajları aç</small></button><button class="reminder-channel whatsapp" id="wa" type="button"><span>◉</span><b>WhatsApp</b><small>WhatsApp'ı aç</small></button></div></div><div class="modal-foot"><button class="ghost" data-close type="button">Kapat</button></div></div></div>`;
    const message=()=>$('#msg')?.value.trim()||text;
    $$('[data-close]').forEach(x=>x.onclick=()=>$('#modalRoot').innerHTML='');
    $('#mail').onclick=()=>{
      if(!email)return toast('Bu kullanıcı için kayıtlı e-posta bulunmuyor.','error');
      notificationLog(id,p,'email');
      window.location.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Aidat hatırlatması')}&body=${encodeURIComponent(message())}`;
    };
    $('#sms').onclick=()=>{
      if(!phone)return toast('Bu kullanıcı için geçerli telefon numarası bulunmuyor.','error');
      notificationLog(id,p,'sms');
      const join=/iPad|iPhone|iPod/.test(navigator.userAgent)?'&':'?';
      window.location.href=`sms:${phone}${join}body=${encodeURIComponent(message())}`;
    };
    $('#wa').onclick=()=>{
      if(!phone)return toast('Bu kullanıcı için geçerli telefon numarası bulunmuyor.','error');
      notificationLog(id,p,'whatsapp');
      launchExternal('https://wa.me/'+phone.replace(/\D/g,'')+'?text='+encodeURIComponent(message()));
    };
  };

  function reinforceMobile(){
    removeBuildBadge();
    if(innerWidth>760)return;
    document.documentElement.classList.add('asrav-mobile-ready');
    $$('#content [data-remind]').forEach(b=>{
      b.setAttribute('type','button');
      b.setAttribute('aria-label','Aidat hatırlatması gönder');
    });
  }

  const previousRender=render;
  render=function(){const result=previousRender();requestAnimationFrame(reinforceMobile);return result};
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(reinforceMobile,20)}).observe(document.body,{childList:true,subtree:true});
  addEventListener('orientationchange',()=>setTimeout(reinforceMobile,250),{passive:true});
  reinforceMobile();

  const style=document.createElement('style');
  style.textContent=`
  .reminder-modal{width:min(680px,calc(100vw - 28px))}.reminder-recipient{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px}.reminder-recipient span{display:grid;gap:3px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#f7faf9;color:#526d68;font-size:11px}.reminder-recipient b{color:#183e3e}.reminder-modal textarea{width:100%;min-height:145px;resize:vertical}.reminder-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}.reminder-channel{min-height:90px;border:1px solid #ccddd8;border-radius:13px;background:#fff;color:#234f4c;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px;cursor:pointer}.reminder-channel span{font-size:23px}.reminder-channel b{font-size:13px}.reminder-channel small{color:#718681;font-size:9px}.reminder-channel:active{transform:scale(.98)}.reminder-channel.whatsapp{border-color:#9ed7b7;background:#f1fbf5;color:#147541}.reminder-channel.sms{border-color:#aad4e0;background:#f1f9fc;color:#126b87}.reminder-channel.mail{border-color:#c5c9e8;background:#f7f7fd;color:#4b5590}
  @media(max-width:760px){
    :root{--mobile-nav-h:76px}html.asrav-mobile-ready{background:#eaf2ef!important}html.asrav-mobile-ready body{font-size:14px!important;-webkit-text-size-adjust:100%;text-size-adjust:100%}
    #app:not(.hidden){background:#edf4f2!important}.main{overscroll-behavior-y:auto!important;scrollbar-width:none}.main::-webkit-scrollbar{display:none}.topbar{min-height:58px!important;border-bottom:1px solid rgba(183,205,199,.65)!important}.content{padding:14px 10px calc(104px + env(safe-area-inset-bottom))!important}
    button,.primary,.ghost,select,input{min-height:44px}textarea{font-size:16px!important}input,select,textarea{max-width:100%;border-radius:11px!important}button{touch-action:manipulation}
    .section-title{margin:2px 2px 12px!important}.section-title h2{font-size:22px!important;line-height:1.15}.section-title p{line-height:1.45;margin-top:5px}.panel,.card{border-radius:16px!important;box-shadow:0 3px 14px rgba(27,65,62,.06)!important}
    .toolbar,.toolbar .left,.toolbar .right,.due-toolbar,.due-filters{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%!important;gap:8px!important}.toolbar button,.due-toolbar button,.due-filters button{width:100%!important}
    .due-filters>*,.due-toolbar>*{min-width:0!important;max-width:100%!important}.overdue-notice{border-radius:15px!important}.overdue-notice button{min-height:44px!important}
    .table-wrap,html body #app #content .table-wrap{border-radius:12px!important;overflow-x:auto!important;overflow-y:visible!important;touch-action:pan-x pan-y!important;scroll-snap-type:none!important;overscroll-behavior-x:auto!important;-webkit-overflow-scrolling:touch!important}.table-wrap:after{position:static!important;margin:8px!important}.table-wrap table{min-width:850px}.table-wrap td,.table-wrap th{padding:11px 9px!important;vertical-align:middle}.table-wrap td button{min-height:38px!important;padding:7px 10px!important;white-space:nowrap}#rows td:last-child{min-width:148px}#rows td:last-child>*{margin:3px!important}
    .modal-backdrop{position:fixed!important;inset:0!important;z-index:5000!important;display:flex!important;align-items:flex-end!important;background:rgba(9,28,30,.55)!important}.modal{display:flex!important;flex-direction:column!important;width:100%!important;max-width:none!important;max-height:94dvh!important;min-height:0!important;border-radius:22px 22px 0 0!important;overflow:hidden!important}.modal-head{flex:0 0 auto!important;padding:15px 16px!important}.modal-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior-y:contain!important;padding:15px!important;-webkit-overflow-scrolling:touch!important}.modal-foot{flex:0 0 auto!important;padding:11px 15px max(12px,env(safe-area-inset-bottom))!important;border-top:1px solid var(--line)!important}.modal-foot button{width:100%!important;min-height:48px!important}
    .reminder-modal{height:auto!important;max-height:94dvh!important}.reminder-recipient{grid-template-columns:1fr!important}.reminder-modal textarea{min-height:130px!important}.reminder-actions{grid-template-columns:1fr!important;gap:8px!important}.reminder-channel{min-height:62px!important;display:grid!important;grid-template-columns:38px 1fr!important;grid-template-rows:auto auto!important;text-align:left!important;justify-items:start!important;padding:9px 13px!important}.reminder-channel span{grid-row:1/3;align-self:center;font-size:25px}.reminder-channel b{align-self:end}.reminder-channel small{align-self:start}.reminder-modal .modal-foot{display:flex!important}
    .mobile-app-nav{left:7px!important;right:7px!important;bottom:max(7px,env(safe-area-inset-bottom))!important;height:66px!important;border-radius:19px!important;box-shadow:0 8px 28px rgba(20,56,55,.18)!important}.mobile-app-nav button{min-height:52px!important}.mobile-app-nav button b{font-size:9px!important}
    .sidebar{padding-top:max(12px,env(safe-area-inset-top))!important}.sidebar .nav button{min-height:48px!important}.sidebar-bottom{padding-bottom:calc(14px + env(safe-area-inset-bottom))!important}
    .idea-actions,.doc-actions,.message-meta,.reply-form>div{display:flex!important;flex-direction:column!important;align-items:stretch!important}.idea-actions>*,.doc-actions>*,.message-meta button,.reply-form button{width:100%!important}.idea-reader-modal{max-height:94dvh!important}
    .health-grid,.grid2,.permission-grid,.cards{gap:10px!important}.health-card{padding:14px!important}.logs-pages-2562{position:relative;gap:6px!important}.error-panel .table-wrap{border-radius:0 0 15px 15px!important}
  }
  @media(max-width:380px){.content{padding-left:8px!important;padding-right:8px!important}.mobile-app-nav{left:4px!important;right:4px!important}.mobile-app-nav button span{font-size:18px!important}.mobile-app-nav button b{font-size:8px!important}}
  `;
  document.head.appendChild(style);
})();
