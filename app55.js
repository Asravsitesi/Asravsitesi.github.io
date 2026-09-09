(()=>{
  function closeReader(){const root=$('#modalRoot');if(root)root.innerHTML=''}
  function reader(title,meta,body,exitLabel,extra=''){
    $('#modalRoot').innerHTML=`<div class="modal-backdrop content-reader-backdrop"><div class="modal content-reader-modal"><div class="modal-head content-reader-head"><div><small>${meta}</small><h3>${title}</h3></div><button class="close" data-reader-close aria-label="Kapat">×</button></div><div class="modal-body content-reader-body"><div class="content-reader-text">${body}</div>${extra}</div><div class="modal-foot"><button class="primary" data-reader-close>${exitLabel}</button></div></div></div>`;
    $$('[data-reader-close]').forEach(x=>x.onclick=closeReader);
    $('.content-reader-backdrop').onclick=e=>{if(e.target===e.currentTarget)closeReader()};
  }
  async function openMessageReader(id){
    const m=(data.siteMessages||[]).find(x=>String(x.id)===String(id));if(!m)return toast('Mesaj bulunamadı.','error');
    const incoming=m.recipient_id===profile.id,other=(data.profiles||[]).find(x=>x.id===(incoming?m.sender_id:m.recipient_id))||{};
    reader(esc(m.subject||'Konusuz mesaj'),`${incoming?'Gönderen':'Alıcı'}: ${esc(other.full_name||other.email||'Kullanıcı')} · ${new Date(m.created_at).toLocaleString('tr-TR')}`,esc(m.body||'').replace(/\n/g,'<br>'),'Mesajdan çık');
    if(incoming&&!m.read_at){const r=await db.rpc('mark_site_message_read',{message_id:+m.id});if(!r.error){m.read_at=new Date().toISOString();const card=$(`[data-message-id="${m.id}"]`);card?.classList.remove('unread');if(typeof render==='function')setTimeout(()=>{if(page==='messages'&&!$('#modalRoot').innerHTML)render()},0)}}
  }
  async function openAnnouncementReader(id){
    const a=(data.announcements||[]).find(x=>String(x.id)===String(id));if(!a)return toast('Duyuru bulunamadı.','error');
    reader(esc(a.title||'Duyuru'),`Duyuru · ${new Date(a.created_at).toLocaleString('tr-TR')}`,esc(a.body||'').replace(/\n/g,'<br>'),'Duyurudan çık');
    try{await db.rpc('mark_announcement_read',{p_announcement_id:+a.id})}catch{}
  }
  function enhanceMessages(){
    if(page!=='messages')return;
    const cards=[...$$('#content .site-message')];
    cards.forEach((card,i)=>{
      const m=(data.siteMessages||[])[i];if(!m)return;
      card.dataset.messageId=m.id;
      const head=card.querySelector('.message-head'),meta=card.querySelector('.message-meta');
      head?.querySelector('h3')?.setAttribute('title',m.subject||'');
      if(meta&&!meta.querySelector('[data-read-full-message]'))meta.insertAdjacentHTML('beforeend',`<button class="primary compact-reader-button" data-read-full-message="${m.id}">Mesajı oku</button>`);
    });
    $$('[data-read-full-message]').forEach(b=>b.onclick=()=>openMessageReader(b.dataset.readFullMessage));
  }
  function enhanceAnnouncements(){
    if(page!=='notices')return;
    const items=[...$$('#content .activity-item')];
    items.forEach((item,i)=>{
      const a=(data.announcements||[])[i];if(!a)return;
      item.dataset.announcementId=a.id;
      const middle=item.children[1];
      if(middle&&!middle.querySelector('[data-read-full-announcement]'))middle.insertAdjacentHTML('beforeend',`<button class="primary compact-reader-button announcement-reader-button" data-read-full-announcement="${a.id}">Duyuruyu gör</button>`);
    });
    $$('[data-read-full-announcement]').forEach(b=>b.onclick=()=>openAnnouncementReader(b.dataset.readFullAnnouncement));
  }
  function enhance(){enhanceMessages();enhanceAnnouncements()}
  const oldRender=render;
  render=()=>{const r=oldRender();enhance();return r};
  let timer;new MutationObserver(()=>{if(page!=='messages'&&page!=='notices')return;clearTimeout(timer);timer=setTimeout(enhance,20)}).observe($('#content'),{childList:true,subtree:true});
  const style=document.createElement('style');style.textContent=`
    .site-message,.activity-item,.message-head,.message-head>div,.activity-item>div{min-width:0!important;max-width:100%!important}
    .site-message{overflow:hidden!important}
    .message-head h3,.activity-item p,.activity-item p b,.site-message>p,.activity-item>div>small,.message-meta,.unified-alert-list button b{max-width:100%!important;overflow-wrap:anywhere!important;word-break:break-word!important;white-space:pre-wrap!important}
    .message-head{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important}
    .activity-item{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:start!important}
    .site-message>p,.activity-item>div>small{overflow:visible!important;text-overflow:clip!important}
    .message-meta{flex-wrap:wrap!important;align-items:center!important}
    .compact-reader-button{min-height:32px!important;padding:6px 11px!important;font-size:11px!important;white-space:nowrap!important}
    .announcement-reader-button{margin-top:10px!important}
    .content-reader-backdrop{padding:12px!important}
    .content-reader-modal{width:min(760px,calc(100vw - 24px))!important;max-width:760px!important;max-height:92vh!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
    .content-reader-head{align-items:flex-start!important;gap:14px!important}
    .content-reader-head>div{min-width:0!important;max-width:calc(100% - 42px)!important}
    .content-reader-head h3{margin:5px 0 0!important;font-size:20px!important;line-height:1.35!important;overflow-wrap:anywhere!important;word-break:break-word!important;white-space:pre-wrap!important}
    .content-reader-head small{display:block!important;color:#48666d!important;overflow-wrap:anywhere!important;word-break:break-word!important}
    .content-reader-body{overflow-y:auto!important;overscroll-behavior:contain!important;padding:18px!important}
    .content-reader-text{font-size:15px!important;line-height:1.8!important;color:#173c45!important;font-weight:540!important;overflow-wrap:anywhere!important;word-break:break-word!important;white-space:normal!important;background:#f5faf9!important;border-left:4px solid #0492C2!important;border-radius:0 12px 12px 0!important;padding:16px!important}
    .content-reader-modal .modal-foot{flex:0 0 auto!important}
    @media(max-width:760px){.message-head{grid-template-columns:1fr!important}.activity-item{grid-template-columns:auto minmax(0,1fr)!important}.activity-item>small:last-child{grid-column:2!important}.content-reader-backdrop{align-items:flex-end!important;padding:0!important}.content-reader-modal{width:100%!important;max-width:none!important;max-height:94vh!important;border-radius:18px 18px 0 0!important}.content-reader-head h3{font-size:18px!important}.content-reader-body{padding:14px!important}.content-reader-text{font-size:14px!important;padding:13px!important}.message-meta .compact-reader-button{width:100%!important}}
  `;document.head.appendChild(style);
})();
