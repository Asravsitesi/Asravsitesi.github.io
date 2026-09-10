(()=>{
  Object.assign(permissionLabels,{ideas_edit:'Fikirleri düzenle'});
  let ideaEnhanceTimer=null;

  function canEditIdeas(){return profile?.role==='admin'||has('ideas_edit')}
  function ideaById(id){return (data.ideas||[]).find(x=>x.id===Number(id))}
  function profileName(id){const p=(data.profiles||[]).find(x=>x.id===id)||{};return p.full_name||p.email||'Kullanıcı'}
  function formatIdeaDate(value){return value?new Date(value).toLocaleString('tr-TR'):'—'}

  function ensureEditPermission(){
    if(page!=='admin'||profile?.role!=='admin')return;
    for(const role of ['manager','owner','tenant','resident']){
      const list=$(`[data-save-role="${role}"]`)?.closest('.permission-card')?.querySelector('.permission-list');
      if(!list||list.querySelector(`[data-role-perm="${role}"][data-key="ideas_edit"]`))continue;
      list.insertAdjacentHTML('beforeend','<label class="permission-item"><input type="checkbox" data-role-perm="'+role+'" data-key="ideas_edit" '+(permissionMap[role]?.ideas_edit?'checked':'')+'><span><b>Fikirleri düzenle</b><small>ideas_edit</small></span></label>');
    }
  }

  async function loadIdeaDetails(id){
    const r=await db.from('feedback_idea_details').select('*').eq('idea_id',Number(id)).order('created_at',{ascending:true});
    if(r.error)throw r.error;
    return r.data||[];
  }

  async function openIdeaReader(id,focusDetail=false){
    const idea=ideaById(id);
    if(!idea)return toast('Fikir bulunamadı.','error');
    $('#modalRoot').innerHTML='<div class="modal-backdrop"><div class="modal idea-reader-modal"><div class="modal-head"><div><h3>Fikir ayrıntıları</h3><small>'+esc(formatIdeaDate(idea.created_at))+'</small></div><button class="close" data-close>×</button></div><div class="modal-body"><span class="idea-status '+esc(idea.status||'submitted')+'">'+esc(typeof statusLabel==='function'?statusLabel(idea.status):idea.status)+'</span><h2 class="idea-reader-title">'+esc(idea.title||'Yeni fikir')+'</h2><div class="idea-reader-description">'+esc(idea.description||'')+'</div><div class="idea-reader-meta"><span><b>Fikri paylaşan:</b> '+esc(profileName(idea.created_by))+'</span><span><b>Atanan:</b> '+esc(idea.assigned_to?profileName(idea.assigned_to):'Atanmamış')+'</span></div><div class="idea-detail-head"><h3>Eklenen detaylar</h3><small id="ideaDetailCount">Yükleniyor…</small></div><div id="ideaDetailList" class="idea-detail-list"><div class="empty">Detaylar yükleniyor…</div></div><div class="idea-detail-form"><div class="field"><label>Yeni detay</label><textarea id="newIdeaDetail" maxlength="4000" placeholder="Bu fikirle ilgili yeni bilgi, gelişme veya not ekleyin"></textarea></div><div class="idea-detail-submit"><small>Eklenen detaylar tarih ve kullanıcı bilgisiyle saklanır.</small><button class="primary" id="saveIdeaDetail">Detay ekle</button></div></div></div><div class="modal-foot"><button class="ghost" data-close>Kapat</button>'+(canEditIdeas()?'<button class="primary" id="editIdeaFromReader">Fikri düzenle</button>':'')+'</div></div></div>';
    $$('[data-close]').forEach(x=>x.onclick=()=>$('#modalRoot').innerHTML='');
    $('#editIdeaFromReader')?.addEventListener('click',()=>openIdeaEditor(id));
    const renderDetails=async()=>{
      try{
        const details=await loadIdeaDetails(id),list=$('#ideaDetailList'),count=$('#ideaDetailCount');
        if(!list)return;
        if(count)count.textContent=details.length+' detay';
        list.innerHTML=details.map(d=>'<article class="idea-detail-item"><div><b>'+esc(profileName(d.created_by))+'</b><time>'+esc(formatIdeaDate(d.created_at))+'</time></div><p>'+esc(d.detail)+'</p></article>').join('')||'<div class="empty">Henüz detay eklenmemiş.</div>';
      }catch(e){const list=$('#ideaDetailList');if(list)list.innerHTML='<div class="empty">Detaylar yüklenemedi.</div>'}
    };
    await renderDetails();
    const textarea=$('#newIdeaDetail');
    if(focusDetail)setTimeout(()=>textarea?.focus(),30);
    $('#saveIdeaDetail').onclick=async()=>{
      const detail=textarea.value.trim();
      if(detail.length<2)return toast('Lütfen en az 2 karakterlik bir detay yazın.','error');
      const button=$('#saveIdeaDetail');button.disabled=true;
      const r=await db.rpc('add_feedback_idea_detail',{p_idea_id:Number(id),p_detail:detail});
      button.disabled=false;
      if(r.error)return toast('Detay eklenemedi: '+r.error.message,'error');
      textarea.value='';toast('Detay fikre eklendi.');await renderDetails();
    };
  }

  function openIdeaEditor(id){
    const idea=ideaById(id);
    if(!idea||!canEditIdeas())return toast('Bu fikri düzenleme yetkiniz bulunmuyor.','error');
    $('#modalRoot').innerHTML='<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><h3>Fikri düzenle</h3><small>Başlık ve açıklamayı güncelleyin</small></div><button class="close" data-close>×</button></div><div class="modal-body"><div class="field"><label>Fikir başlığı</label><input id="editIdeaTitle" maxlength="160" value="'+esc(idea.title||'')+'"></div><div class="field"><label>Açıklama</label><textarea id="editIdeaDescription" maxlength="4000">'+esc(idea.description||'')+'</textarea></div></div><div class="modal-foot"><button class="ghost" data-close>Vazgeç</button><button class="primary" id="saveIdeaEdit">Değişiklikleri kaydet</button></div></div></div>';
    $$('[data-close]').forEach(x=>x.onclick=()=>$('#modalRoot').innerHTML='');
    $('#saveIdeaEdit').onclick=async()=>{
      const title=$('#editIdeaTitle').value.trim(),description=$('#editIdeaDescription').value.trim();
      if(title.length<2)return toast('Fikir başlığı en az 2 karakter olmalıdır.','error');
      if(description.length<5)return toast('Fikir açıklaması en az 5 karakter olmalıdır.','error');
      const button=$('#saveIdeaEdit');button.disabled=true;
      const r=await db.from('feedback_ideas').update({title,description,updated_at:new Date().toISOString()}).eq('id',Number(id));
      button.disabled=false;
      if(r.error)return toast('Fikir düzenlenemedi: '+r.error.message,'error');
      $('#modalRoot').innerHTML='';toast('Fikir güncellendi.');await loadAll();
    };
  }

  function enhanceIdeaCards(){
    if(page!=='ideas')return;
    const editable=canEditIdeas();
    const cards=[...($('#content')?.querySelectorAll('.idea-card')||[])];
    cards.forEach((card,index)=>{
      const idea=(data.ideas||[])[index];if(!idea)return;
      let actions=card.querySelector('.idea-actions');
      if(!actions){actions=document.createElement('div');actions.className='idea-actions';card.appendChild(actions)}
      if(!actions.querySelector(`[data-read-idea="${idea.id}"]`)){
        const read=document.createElement('button');read.className='ghost';read.dataset.readIdea=idea.id;read.textContent='Fikri oku';read.onclick=()=>openIdeaReader(idea.id,false);actions.prepend(read);
      }
      if(!actions.querySelector(`[data-add-idea-detail="${idea.id}"]`)){
        const detail=document.createElement('button');detail.className='ghost';detail.dataset.addIdeaDetail=idea.id;detail.textContent='Detay ekle';detail.onclick=()=>openIdeaReader(idea.id,true);actions.appendChild(detail);
      }
      if(editable&&!actions.querySelector(`[data-edit-idea="${idea.id}"]`)){
        const edit=document.createElement('button');edit.className='primary';edit.dataset.editIdea=idea.id;edit.textContent='Fikri düzenle';edit.onclick=()=>openIdeaEditor(idea.id);actions.appendChild(edit);
      }
      if(!editable){
        const save=actions.querySelector('[data-save-idea-status]');
        const select=actions.querySelector('[data-idea-status]');
        save?.remove();select?.remove();
      }
    });
  }

  const previousSaveRolePermissions=saveRolePermissions;
  saveRolePermissions=role=>{
    const edit=$(`[data-role-perm="${role}"][data-key="ideas_edit"]`);
    const view=$(`[data-role-perm="${role}"][data-key="ideas_view_all"]`);
    if(edit?.checked&&view)view.checked=true;
    return previousSaveRolePermissions(role);
  };

  const style=document.createElement('style');
  style.textContent='.idea-reader-modal{width:min(760px,calc(100vw - 28px));max-height:min(90vh,900px)}.idea-reader-modal .modal-body{overflow:auto}.idea-reader-title{margin:12px 0 8px}.idea-reader-description{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;padding:14px;background:#f7faf9;border:1px solid var(--line);border-radius:10px}.idea-reader-meta{display:flex;gap:14px;flex-wrap:wrap;margin:12px 0;color:var(--muted);font-size:11px}.idea-detail-head{display:flex;justify-content:space-between;align-items:center;margin-top:18px;border-top:1px solid var(--line);padding-top:15px}.idea-detail-head h3{margin:0}.idea-detail-head small{color:var(--muted)}.idea-detail-list{display:grid;gap:8px;margin:10px 0 14px}.idea-detail-item{padding:11px 12px;border:1px solid #d8e6e2;border-radius:9px;background:#fff}.idea-detail-item>div{display:flex;justify-content:space-between;gap:10px}.idea-detail-item time{font-size:10px;color:var(--muted)}.idea-detail-item p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;margin:7px 0 0}.idea-detail-form{padding:13px;background:#f5faf8;border-radius:10px}.idea-detail-form textarea{min-height:95px}.idea-detail-submit{display:flex;justify-content:space-between;align-items:center;gap:10px}.idea-detail-submit small{color:var(--muted)}@media(max-width:760px){.idea-reader-modal{width:calc(100vw - 16px);max-height:94vh}.idea-detail-submit,.idea-detail-item>div{align-items:stretch;flex-direction:column}.idea-detail-submit button{width:100%}.idea-reader-meta{flex-direction:column;gap:5px}}';
  document.head.appendChild(style);

  const previousRender=render;
  render=()=>{const result=previousRender();ensureEditPermission();setTimeout(enhanceIdeaCards,0);return result};
  new MutationObserver(()=>{
    if(page!=='ideas'&&page!=='admin')return;
    clearTimeout(ideaEnhanceTimer);
    ideaEnhanceTimer=setTimeout(()=>{ensureEditPermission();enhanceIdeaCards()},0);
  }).observe($('#content'),{childList:true,subtree:true});
})();
