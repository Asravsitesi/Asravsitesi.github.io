(()=>{
  const style=document.createElement('style');
  style.id='final-due-layout-fix';
  style.textContent=`
    html body #app #content .table-wrap{overflow-x:auto!important;overflow-y:visible!important}
    html body #app #content table#rows{width:100%!important;min-width:1240px!important;table-layout:auto!important}
    html body #app #content table#rows th:nth-child(7),html body #app #content table#rows td:nth-child(7){width:210px!important;min-width:210px!important;max-width:210px!important;padding-left:10px!important;padding-right:10px!important;overflow:hidden!important;white-space:nowrap!important;position:relative!important}
    html body #app #content table#rows th:nth-child(8),html body #app #content table#rows td:nth-child(8){width:350px!important;min-width:350px!important;padding-left:10px!important;padding-right:10px!important;white-space:nowrap!important}
    html body #app #content table#rows tr[data-final-status] td:nth-child(7)>*{display:none!important;visibility:hidden!important}
    html body #app #content table#rows tr[data-final-status] td:nth-child(7)::after{position:static!important;inset:auto!important;float:none!important;display:inline-flex!important;max-width:100%!important;box-sizing:border-box!important;margin:0!important;transform:none!important;vertical-align:middle!important;overflow:hidden!important;text-overflow:ellipsis!important}
    html body #app #content table#rows td:nth-child(8) .doc-actions{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:nowrap!important;min-width:max-content!important}
    html body #app #content table#rows td:nth-child(8) button{position:relative!important;z-index:1!important;flex:0 0 auto!important}
    #forgotPanel{margin-top:14px;padding:14px;border:1px solid #dfe5eb;border-radius:12px;background:#f8fafc}
    #forgotPanel .field{margin-bottom:10px}#forgotPanel .forgot-actions{display:flex;gap:8px}#forgotPanel .forgot-actions button{flex:1}
    #forgotPassword{width:100%;margin-top:10px;color:#245b70}
    #recoveryForm .field{margin-bottom:14px}
    @media(max-width:760px){html body #app #content table#rows{min-width:1180px!important}}
  `;
  document.head.appendChild(style);

  const toggle=document.querySelector('#authToggle');
  const submit=document.querySelector('#authSubmit');
  if(!toggle||!submit)return;
  submit.insertAdjacentHTML('afterend',`<button class="ghost" type="button" id="forgotPassword">Şifremi unuttum</button><div id="forgotPanel" class="hidden"><div class="field"><label>Hesabınızın e-posta adresi</label><input id="forgotEmail" type="email" autocomplete="email" placeholder="ornek@email.com"></div><div class="forgot-actions"><button class="primary" type="button" id="sendReset">Sıfırlama bağlantısı gönder</button><button class="ghost" type="button" id="cancelReset">Vazgeç</button></div></div>`);
  const forgotBtn=document.querySelector('#forgotPassword'),panel=document.querySelector('#forgotPanel'),emailInput=document.querySelector('#forgotEmail'),sendBtn=document.querySelector('#sendReset');
  function closeForgot(){panel.classList.add('hidden');forgotBtn.classList.remove('hidden');submit.classList.remove('hidden');toggle.classList.remove('hidden');document.querySelector('#loginTitle').textContent='Hesabınıza giriş yapın';document.querySelector('#loginSub').textContent='Asrav Sitesi ortak yönetim sistemine devam edin.'}
  forgotBtn.onclick=()=>{panel.classList.remove('hidden');forgotBtn.classList.add('hidden');submit.classList.add('hidden');toggle.classList.add('hidden');emailInput.value=document.querySelector('#loginEmail').value.trim();document.querySelector('#loginTitle').textContent='Şifrenizi sıfırlayın';document.querySelector('#loginSub').textContent='E-posta adresinize güvenli bir şifre sıfırlama bağlantısı gönderelim.';emailInput.focus()};
  document.querySelector('#cancelReset').onclick=closeForgot;
  sendBtn.onclick=async()=>{const email=emailInput.value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast('Geçerli bir e-posta adresi girin.','error');sendBtn.disabled=true;const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:AUTH_REDIRECT});sendBtn.disabled=false;if(error){const m=String(error.message||'');if(/rate|security purposes/i.test(m))return toast('Kısa süre önce bağlantı gönderildi. Lütfen en az 60 saniye bekleyin.','error',7000);return toast('İstek tamamlanamadı. Lütfen daha sonra tekrar deneyin.','error')}toast('Bu adres sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.','success',9000)};
  const originalSetAuthMode=setAuthMode;
  setAuthMode=function(v){originalSetAuthMode(v);forgotBtn.classList.toggle('hidden',v);if(v)panel.classList.add('hidden')};

  function showRecovery(){
    authNoticeShown=true;document.querySelector('#app').classList.add('hidden');document.querySelector('#login').classList.remove('hidden');
    const card=document.querySelector('#loginForm');card.innerHTML=`<h2>Yeni şifrenizi belirleyin</h2><p class="sub">Güvenliğiniz için en az 8 karakterli yeni bir şifre oluşturun.</p><div id="recoveryForm"><div class="field"><label>Yeni şifre</label><input id="newPassword" type="password" minlength="8" maxlength="128" autocomplete="new-password"></div><div class="field"><label>Yeni şifre tekrar</label><input id="newPasswordAgain" type="password" minlength="8" maxlength="128" autocomplete="new-password"></div><button class="primary" type="button" id="saveNewPassword" style="width:100%">Yeni şifreyi kaydet</button></div>`;
    document.querySelector('#saveNewPassword').onclick=async()=>{const a=document.querySelector('#newPassword').value,b=document.querySelector('#newPasswordAgain').value,btn=document.querySelector('#saveNewPassword');if(a.length<8)return toast('Yeni şifre en az 8 karakter olmalıdır.','error');if(a!==b)return toast('Şifreler birbiriyle eşleşmiyor.','error');btn.disabled=true;const {error}=await db.auth.updateUser({password:a});if(error){btn.disabled=false;return toast('Şifre güncellenemedi: '+error.message,'error')}toast('Şifreniz değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.','success',7000);await db.auth.signOut();history.replaceState({},'',location.pathname);setTimeout(()=>location.reload(),1200)};
  }
  if(authType==='recovery')showRecovery();
  db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')showRecovery()});
})();
