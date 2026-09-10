(()=>{
  Object.assign(permissionLabels,{profiles_manage:'Kullanıcı bilgilerini düzenle'});
  const prefLabels={email:'E-posta',sms:'SMS',whatsapp:'WhatsApp'};
  const canManage=()=>profile?.role==='admin'||has('profiles_manage');

  function hideResend(){
    const button=document.getElementById('resendConfirm');
    if(button){button.classList.add('hidden');button.hidden=true;button.disabled=true;button.setAttribute('aria-hidden','true')}
  }

  function ensurePermissionControls(){
    if(page!=='admin'||profile?.role!=='admin')return;
    for(const role of ['manager','owner','tenant','resident']){
      const list=document.querySelector(`[data-save-role="${role}"]`)?.closest('.permission-card')?.querySelector('.permission-list');
      if(!list||list.querySelector(`[data-role-perm="${role}"][data-key="profiles_manage"]`))continue;
      list.insertAdjacentHTML('beforeend','<label class="permission-item"><input type="checkbox" data-role-perm="'+role+'" data-key="profiles_manage" '+(permissionMap[role]?.profiles_manage?'checked':'')+'><span><b>Kullanıcı bilgilerini düzenle</b><small>profiles_manage</small></span></label>');
    }
  }

  function openProfileEditor(id){
    if(!canManage())return toast('Kullanıcı bilgilerini düzenleme yetkiniz yok.','error');
    const p=(data.profiles||[]).find(x=>x.id===id);if(!p)return toast('Kullanıcı bulunamadı.','error');
    const selected=Array.isArray(p.communication_preferences)&&p.communication_preferences.length?p.communication_preferences:['email'];
    document.getElementById('modalRoot').innerHTML='<div class="modal-backdrop"><div class="modal profile-details-modal"><div class="modal-head"><div><h3>Kullanıcı bilgilerini düzenle</h3><small>'+esc(p.full_name||p.email||'Kullanıcı')+'</small></div><button class="close" data-close>×</button></div><div class="modal-body"><div class="profile-edit-grid"><div class="field"><label>Ad soyad</label><input id="profileEditName" value="'+esc(p.full_name||'')+'"></div><div class="field"><label>E-posta</label><input id="profileEditEmail" type="email" value="'+esc(p.email||'')+'"></div><div class="field"><label>Telefon 1</label><input id="profileEditPhone" type="tel" value="'+esc(p.phone||'')+'" placeholder="05XX XXX XX XX"></div><div class="field"><label>Telefon 2</label><input id="profileEditPhone2" type="tel" value="'+esc(p.phone_secondary||'')+'" placeholder="05XX XXX XX XX"></div></div><div class="field"><label>İletişim tercihleri</label><div class="profile-edit-prefs">'+Object.entries(prefLabels).map(([key,label])=>'<label><input type="checkbox" data-profile-pref value="'+key+'" '+(selected.includes(key)?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div></div><div class="profile-edit-note">Villa ve roller kullanıcı satırındaki mevcut alanlardan yönetilir. Şifre işlemleri güvenlik nedeniyle yalnızca admin tarafından yapılır.</div></div><div class="modal-foot"><button class="ghost" data-close>Vazgeç</button><button class="primary" id="saveProfileDetails">Kaydet</button></div></div></div>';
    document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>document.getElementById('modalRoot').innerHTML='');
    document.getElementById('saveProfileDetails').onclick=async()=>{
      const name=document.getElementById('profileEditName').value.trim(),email=document.getElementById('profileEditEmail').value.trim(),raw1=document.getElementById('profileEditPhone').value.trim(),raw2=document.getElementById('profileEditPhone2').value.trim(),phone=normalizeContactPhone(raw1),phone2=normalizeContactPhone(raw2),prefs=[...document.querySelectorAll('[data-profile-pref]:checked')].map(x=>x.value),button=document.getElementById('saveProfileDetails');
      if(!name)return toast('Ad soyad gereklidir.','error');
      if(!email||!email.includes('@'))return toast('Geçerli bir e-posta adresi girin.','error');
      if(raw1&&!phone)return toast('Telefon 1 geçersiz.','error');
      if(raw2&&!phone2)return toast('Telefon 2 geçersiz.','error');
      if(!prefs.length)return toast('En az bir iletişim tercihi seçin.','error');
      button.disabled=true;
      const r=await db.rpc('update_resident_profile',{target_user_id:id,p_full_name:name,p_email:email,p_phone:phone||null,p_phone_secondary:phone2||null,p_preferences:prefs});
      button.disabled=false;
      if(r.error)return toast('Kullanıcı bilgileri güncellenemedi: '+r.error.message,'error');
      document.getElementById('modalRoot').innerHTML='';toast('Kullanıcı bilgileri güncellendi.');await loadAll();
    };
  }

  function enhanceAdminUsers(){
    if(page!=='admin'||profile?.role!=='admin')return;
    document.querySelectorAll('[data-profile]').forEach(save=>{
      const id=save.dataset.profile,row=save.closest('tr');if(!row)return;
      let line=row.querySelector('.user-action-line');
      if(!line){line=document.createElement('div');line.className='user-action-line';save.before(line);line.appendChild(save)}
      if(!line.querySelector(`[data-edit-profile-details="${id}"]`)){
        const button=document.createElement('button');button.type='button';button.className='profile-edit-button';button.dataset.editProfileDetails=id;button.textContent='✎ Kullanıcıyı düzenle';line.prepend(button);
      }
    });
    document.querySelectorAll('[data-edit-profile-details]').forEach(button=>button.onclick=()=>openProfileEditor(button.dataset.editProfileDetails));
  }

  function enhanceResidentUsers(){
    if(page!=='residentContacts'||!canManage())return;
    document.querySelectorAll('.resident-role-table tbody tr').forEach(row=>{
      const email=(row.children[2]?.textContent||'').trim().toLowerCase(),p=(data.profiles||[]).find(x=>(x.email||'').trim().toLowerCase()===email);if(!p)return;
      const box=row.querySelector('.resident-row-buttons');if(!box)return;
      let button=box.querySelector('[data-role-admin]')||box.querySelector('[data-edit-profile-from-residents]');
      if(!button){button=document.createElement('button');button.type='button';button.className='resident-table-btn';box.prepend(button)}
      button.removeAttribute('data-role-admin');button.dataset.editProfileFromResidents=p.id;button.textContent='✎ Kullanıcıyı düzenle';button.onclick=()=>openProfileEditor(p.id);
    });
  }

  function apply(){hideResend();ensurePermissionControls();enhanceAdminUsers();enhanceResidentUsers()}
  const previousRender=render;
  render=function(){const result=previousRender();apply();requestAnimationFrame(apply);return result};
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,25)}).observe(document.body,{childList:true,subtree:true});

  const style=document.createElement('style');style.textContent=`
    #resendConfirm{display:none!important}
    .action-confirm-icon{background:#e8f6ef!important;color:#267b58!important}
    #approveConfirmedAction{border-color:#237654!important;background:linear-gradient(135deg,#329468,#237654)!important;color:#fff!important;box-shadow:0 7px 18px rgba(35,118,84,.25)!important}
    #approveConfirmedAction:hover{background:linear-gradient(135deg,#3ba477,#286f55)!important}
    #cancelConfirmedAction{border-color:#b8d3c8!important;color:#286a53!important;background:#f7fbf9!important}
    #content .resident-table-btn:not(.danger-lite),#content .role-multi-save,#content .user-action-line button,.profile-details-modal #saveProfileDetails{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;border:1px solid #237654!important;border-radius:9px!important;background:linear-gradient(135deg,#329468,#237654)!important;color:#fff!important;font-weight:800!important;box-shadow:0 4px 11px rgba(35,118,84,.18)!important}
    #content .resident-table-btn:not(.danger-lite):hover,#content .role-multi-save:hover,#content .user-action-line button:hover{background:linear-gradient(135deg,#3ba477,#286f55)!important;transform:translateY(-1px)!important}
    #content .resident-table-btn{min-height:31px!important;height:auto!important;padding:6px 9px!important}
    #content .user-action-line{gap:7px!important;flex-wrap:wrap!important}
    #content .user-action-line button{min-height:34px!important;height:auto!important;padding:7px 10px!important;font-size:10px!important}
    .profile-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.profile-edit-prefs{display:flex;gap:8px;flex-wrap:wrap}.profile-edit-prefs label{display:flex;align-items:center;gap:7px;padding:9px 11px;border:1px solid #cbded6;border-radius:9px;background:#f8fbfa}.profile-edit-prefs input{accent-color:#2d8a5c}.profile-edit-note{margin-top:12px;padding:10px 12px;border-radius:9px;background:#eef7f3;color:#416b5d;font-size:11px;line-height:1.45}
    @media(max-width:760px){.profile-edit-grid{grid-template-columns:1fr}.profile-edit-prefs{display:grid;grid-template-columns:1fr 1fr}.profile-edit-button{width:100%!important}}
  `;document.head.appendChild(style);apply();
})();
