(()=>{
  Object.assign(permissionLabels,{
    ideas_delete:'Fikirleri sil',
    ideas_assign:'Fikirleri kullanıcıya ata',
    ideas_notify:'Fikir sahibiyle ilgili bildirim gönder'
  });

  let assignees=null,assigneePromise=null,enhanceTimer=null;

  async function loadAssignees(){
    if(!(profile?.role==='admin'||has('ideas_assign')))return [];
    if(assignees)return assignees;
    if(!assigneePromise)assigneePromise=db.rpc('get_idea_assignees').then(r=>{
      if(r.error)throw r.error;
      assignees=r.data||[];
      return assignees;
    }).finally(()=>{assigneePromise=null});
    return assigneePromise;
  }

  function ensurePermissionControls(){
    if(page!=='admin'||profile?.role!=='admin')return;
    const defs=[
      ['ideas_delete','Fikirleri sil'],
      ['ideas_assign','Fikirleri kullanıcıya ata'],
      ['ideas_notify','Fikir sahibiyle ilgili bildirim gönder']
    ];
    for(const role of ['manager','owner','tenant','resident']){
      const list=$(`[data-save-role="${role}"]`)?.closest('.permission-card')?.querySelector('.permission-list');
      if(!list)continue;
      for(const [key,label] of defs){
        if(list.querySelector(`[data-role-perm="${role}"][data-key="${key}"]`))continue;
        list.insertAdjacentHTML('beforeend','<label class="permission-item"><input type="checkbox" data-role-perm="'+role+'" data-key="'+key+'" '+(permissionMap[role]?.[key]?'checked':'')+'><span><b>'+label+'</b><small>'+key+'</small></span></label>');
      }
    }
  }

  function assigneeName(id){
    const p=(assignees||[]).find(x=>x.user_id===id)||data.profiles?.find(x=>x.id===id);
    return p?.full_name||p?.email||'Atanmamış';
  }

  async function assignIdea(id,select,button){
    button.disabled=true;
    const value=select.value||null;
    const r=await db.rpc('assign_feedback_idea',{p_idea_id:id,p_assignee_id:value});
    button.disabled=false;
    if(r.error)return toast('Fikir atanamadı: '+r.error.message,'error');
    toast(value?'Fikir kullanıcıya atandı.':'Fikir ataması kaldırıldı.');
    assignees=null;
    await loadAll();
  }

  async function deleteIdea(id,button){
    if(!confirm('Bu fikir kalıcı olarak silinsin mi?'))return;
    button.disabled=true;
    const r=await db.from('feedback_ideas').delete().eq('id',id);
    button.disabled=false;
    if(r.error)return toast('Fikir silinemedi: '+r.error.message,'error');
    toast('Fikir silindi.');
    await loadAll();
  }

  async function enhanceIdeas(){
    if(page!=='ideas')return;
    const canAssign=profile?.role==='admin'||has('ideas_assign');
    const canDelete=profile?.role==='admin'||has('ideas_delete');
    if(canAssign){
      try{await loadAssignees()}catch(e){
        toast('Atanabilir kullanıcılar yüklenemedi.','error');
        return;
      }
    }
    const cards=[...$('#content')?.querySelectorAll('.idea-card')||[]];
    cards.forEach((card,index)=>{
      if(card.dataset.assignmentReady)return;
      const idea=(data.ideas||[])[index];
      if(!idea)return;
      card.dataset.assignmentReady='1';
      const actions=card.querySelector('.idea-actions')||document.createElement('div');
      if(!actions.isConnected){actions.className='idea-actions';card.appendChild(actions)}
      const info=document.createElement('div');
      info.className='idea-assignment-info';
      info.innerHTML='<small>Atanan kullanıcı</small><b>'+esc(idea.assigned_to?assigneeName(idea.assigned_to):'Atanmamış')+'</b>'+(idea.assigned_at?'<span>'+new Date(idea.assigned_at).toLocaleString('tr-TR')+'</span>':'');
      actions.before(info);
      if(canAssign){
        const wrap=document.createElement('div');
        wrap.className='idea-assignment-actions';
        wrap.innerHTML='<select data-idea-assignee="'+idea.id+'"><option value="">Atamayı kaldır</option>'+assignees.map(p=>'<option value="'+p.user_id+'" '+(p.user_id===idea.assigned_to?'selected':'')+'>'+esc(p.full_name||p.email||'Kullanıcı')+(p.email?' · '+esc(p.email):'')+'</option>').join('')+'</select><button class="ghost" data-assign-idea="'+idea.id+'">Kullanıcıya ata</button>';
        actions.appendChild(wrap);
        const select=wrap.querySelector('select'),button=wrap.querySelector('button');
        button.onclick=()=>assignIdea(idea.id,select,button);
      }
      if(canDelete){
        const button=document.createElement('button');
        button.className='danger';
        button.dataset.deleteIdea=idea.id;
        button.textContent='Fikri sil';
        button.onclick=()=>deleteIdea(idea.id,button);
        actions.appendChild(button);
      }
    });
  }

  const previousSaveRolePermissions=saveRolePermissions;
  saveRolePermissions=role=>{
    const assign=$(`[data-role-perm="${role}"][data-key="ideas_assign"]`);
    const remove=$(`[data-role-perm="${role}"][data-key="ideas_delete"]`);
    const notify=$(`[data-role-perm="${role}"][data-key="ideas_notify"]`);
    const view=$(`[data-role-perm="${role}"][data-key="ideas_view_all"]`);
    if((assign?.checked||remove?.checked||notify?.checked)&&view)view.checked=true;
    return previousSaveRolePermissions(role);
  };

  const style=document.createElement('style');
  style.textContent='.idea-assignment-info{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding:10px 12px;border:1px solid #d8e6e2;border-radius:9px;background:#f5faf8}.idea-assignment-info small{color:var(--muted)}.idea-assignment-info b{color:#205f55}.idea-assignment-info span{margin-left:auto;font-size:10px;color:var(--muted)}.idea-assignment-actions{display:flex;gap:7px;align-items:center;flex:1;min-width:330px}.idea-assignment-actions select{flex:1;min-width:210px}@media(max-width:760px){.idea-assignment-info{align-items:flex-start;flex-direction:column}.idea-assignment-info span{margin-left:0}.idea-assignment-actions{min-width:100%;flex-direction:column;align-items:stretch}.idea-assignment-actions select,.idea-assignment-actions button{width:100%!important}}';
  document.head.appendChild(style);

  const previousRender=render;
  render=()=>{
    const result=previousRender();
    ensurePermissionControls();
    setTimeout(enhanceIdeas,0);
    return result;
  };

  new MutationObserver(()=>{
    if(page!=='ideas'&&page!=='admin')return;
    clearTimeout(enhanceTimer);
    enhanceTimer=setTimeout(()=>{
      ensurePermissionControls();
      enhanceIdeas();
    },0);
  }).observe($('#content'),{childList:true,subtree:true});
})();
