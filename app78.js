(()=>{
  const roleOrder=['admin','manager','owner','tenant','resident'];
  const roleText={admin:'Admin',manager:'Yönetici',owner:'Ev Sahibi',tenant:'Kiracı',resident:'Atama Bekliyor'};
  const getRoles=p=>Array.isArray(p?.roles)&&p.roles.length?p.roles:[p?.role||p?.resident_role||'resident'];

  function roleChoices(id,kind,selected){
    return '<div class="final-multi-role-box" data-final-role-id="'+id+'" data-final-role-kind="'+kind+'">'+roleOrder.map(role=>'<label class="final-role-choice '+role+'"><input type="checkbox" value="'+role+'" '+(selected.includes(role)?'checked':'')+'><span>'+roleText[role]+'</span></label>').join('')+'</div><button type="button" class="primary final-role-save" data-final-role-save="'+kind+'|'+id+'">Rolleri kaydet</button>';
  }

  async function saveRoles(button){
    const [kind,id]=button.dataset.finalRoleSave.split('|'),box=button.parentElement.querySelector('.final-multi-role-box');
    let selected=[...box.querySelectorAll('input:checked')].map(x=>x.value);if(!selected.length)selected=['resident'];
    button.disabled=true;let result;
    if(kind==='profile'){
      const p=(data.profiles||[]).find(x=>x.id===id);
      result=await db.rpc('set_profile_roles',{target_user_id:id,target_roles:selected,target_unit_id:p?.unit_id||null});
    }else result=await db.rpc('set_resident_contact_roles',{p_contact_id:+id,p_roles:selected});
    button.disabled=false;
    if(result.error)return toast('Roller güncellenemedi: '+result.error.message,'error');
    toast('Roller güncellendi. En yetkili rol uygulanıyor.');await loadAll();
  }

  function restoreMultiRoles(){
    if(page!=='residentContacts')return;
    document.querySelectorAll('.resident-role-control').forEach(control=>{
      if(control.querySelector('.final-multi-role-box'))return;
      const old=control.querySelector('[data-save-resident-role]');if(!old)return;
      const key=old.dataset.saveResidentRole||'',separator=key.indexOf('-');if(separator<0)return;
      const kind=key.slice(0,separator),id=key.slice(separator+1);
      if(kind==='profile'&&profile?.role!=='admin')return;
      if(kind==='manual'&&!(profile?.role==='admin'||has('residents_contacts_manage')))return;
      const record=kind==='profile'?(data.profiles||[]).find(x=>x.id===id):(data.residentContacts||[]).find(x=>String(x.id)===id);
      if(!record)return;
      control.classList.add('final-multi-role-control');
      control.innerHTML=roleChoices(id,kind,getRoles(record));
      control.querySelector('[data-final-role-save]').onclick=e=>saveRoles(e.currentTarget);
    });
  }

  function apply(){restoreMultiRoles()}
  const previousRender=render;render=function(){const result=previousRender();apply();requestAnimationFrame(apply);return result};
  let timer;new MutationObserver(()=>{if(page!=='residentContacts')return;clearTimeout(timer);timer=setTimeout(apply,35)}).observe(document.getElementById('content'),{childList:true,subtree:true});

  const style=document.createElement('style');style.textContent=`
    html body #modalRoot #approveConfirmedAction{background:linear-gradient(135deg,#087f84 0%,#075f69 100%)!important;border-color:#075c64!important;color:#fff!important;box-shadow:0 5px 14px rgba(7,105,111,.22),inset 0 1px 0 rgba(255,255,255,.2)!important}
    html body #modalRoot #approveConfirmedAction:hover{background:linear-gradient(135deg,#089097 0%,#076975 100%)!important;border-color:#075c64!important;color:#fff!important}
    html body #modalRoot .action-confirm-icon{background:#e7f4f5!important;color:#08737b!important}
    .final-multi-role-control{display:grid!important;grid-template-columns:minmax(280px,1fr) auto!important;align-items:center!important;gap:8px!important;min-width:440px!important;white-space:normal!important}
    .final-multi-role-box{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px!important}
    .final-role-choice{display:inline-flex!important;align-items:center!important;gap:4px!important;margin:0!important;padding:4px 7px!important;border:1px solid #c9dbd6!important;border-radius:7px!important;background:#f7fbfa!important;font-size:10px!important;font-weight:800!important;white-space:nowrap!important}
    .final-role-choice input{width:15px!important;height:15px!important;margin:0!important;accent-color:#087f84!important}
    .final-role-choice.admin{border-color:#edb8af!important;background:#fff5f3!important}.final-role-choice.manager{border-color:#acd3df!important;background:#f0f9fc!important}.final-role-choice.owner{border-color:#acd8c8!important;background:#f0faf6!important}
    html body #app #content .final-role-save{min-height:36px!important;padding:7px 11px!important;border:1px solid #075c64!important;border-radius:10px!important;background:linear-gradient(135deg,#087f84 0%,#075f69 100%)!important;color:#fff!important;font-size:10px!important;font-weight:850!important;box-shadow:0 5px 14px rgba(7,105,111,.2)!important;white-space:nowrap!important}
    html body #app #content .final-role-save:hover{background:linear-gradient(135deg,#089097 0%,#076975 100%)!important}
    @media(max-width:760px){.final-multi-role-control{grid-template-columns:1fr!important;min-width:330px!important;align-items:stretch!important}.final-role-save{width:100%!important;min-height:44px!important}.final-role-choice{font-size:9px!important;padding:4px 6px!important}}
  `;document.head.appendChild(style);apply();
})();
