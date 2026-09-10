(()=>{
  function installCenteredExcel(){
    if(!window.XLSX?.utils?.json_to_sheet||XLSX.utils.json_to_sheet.__asravCentered)return;
    const original=XLSX.utils.json_to_sheet;
    function centered(){
      const ws=original.apply(this,arguments);
      Object.keys(ws).filter(k=>k[0]!=='!').forEach(k=>{const cell=ws[k];cell.s=Object.assign({},cell.s,{alignment:{horizontal:'center',vertical:'center',wrapText:true}});});
      const range=ws['!ref']?XLSX.utils.decode_range(ws['!ref']):null;if(range)ws['!rows']=Array.from({length:range.e.r-range.s.r+1},()=>({hpt:24}));
      return ws;
    }
    centered.__asravCentered=true;XLSX.utils.json_to_sheet=centered;
  }
  installCenteredExcel();

  const norm=s=>(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const moneyTr=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n)||0);
  const roleLabels={admin:'Admin',manager:'Yönetici',owner:'Ev Sahibi',tenant:'Kiracı',resident:'Atama Bekliyor'};
  const allowed=perm=>typeof has==='function'?has(perm):true;
  function ownDues(){return (data?.dues||[]).filter(d=>String(d.unit_id)===String(profile?.unit_id));}
  function dueLeft(d){const current=(d.current_due_paid===true||(d.current_due_paid==null&&d.status==='paid'))?0:Number(d.amount)||0,gross=Math.max(0,Number(d.previous_debt)||0),paid=Math.max(0,Number(d.previous_debt_paid_amount!=null?d.previous_debt_paid_amount:(d.previous_debt_paid?gross:0))||0);return current+Math.max(0,gross-paid);}
  function roles(){const list=Array.isArray(profile?.roles)&&profile.roles.length?profile.roles:[profile?.role||'resident'];return [...new Set(list)].map(x=>roleLabels[x]||x).join(', ');}
  function go(pageName){const button=document.querySelector('#nav [data-page="'+pageName+'"]');if(!button||button.hidden)return false;button.click();return true;}

  function answer(question){
    const q=norm(question);
    if(/(merhaba|selam|gunaydin|iyi aksamlar)/.test(q))return 'Merhaba '+(profile?.full_name||'')+'! Aidatlar, bütçe, belgeler, duyurular, roller ve sistem kullanımı hakkında yardımcı olabilirim.';
    if(/(rol|yetki)/.test(q))return 'Tanımlı rolleriniz: <b>'+esc(roles())+'</b>. Sistem işlemlerde seçili rolleriniz arasındaki en yetkili rolün kurallarını uygular.';
    if(/(aidat|borc|odeme)/.test(q)){
      if(!allowed('dues_view'))return 'Aidat bilgilerini görüntüleme yetkiniz bulunmuyor.';
      const list=ownDues(),left=list.reduce((s,d)=>s+dueLeft(d),0),open=list.filter(d=>dueLeft(d)>0).length;
      return '<b>'+esc(unit(profile?.unit_id))+'</b> için toplam kalan borç <b>'+esc(moneyTr(left))+'</b>. Açık dönem sayısı: <b>'+open+'</b>.'+(go('dues')?' Aidatlar sayfasını açtım.':'');
    }
    if(/(butce|harcama|planlanan)/.test(q)){
      if(!allowed('budgets_view'))return 'Bütçe bilgilerini görüntüleme yetkiniz bulunmuyor.';
      const list=data?.budgets||[],planned=list.reduce((s,x)=>s+(Number(x.planned_amount??x.planned??x.amount)||0),0),spent=list.reduce((s,x)=>s+(Number(x.spent_amount??x.spent)||0),0);
      go('budgets');return 'Bütçe sayfasını açtım. Görüntülenen kayıtlarda planlanan toplam <b>'+esc(moneyTr(planned))+'</b>, harcanan toplam <b>'+esc(moneyTr(spent))+'</b>.';
    }
    if(/(duyuru|haber ver|bildirim)/.test(q)){if(!allowed('announcements_view'))return 'Duyuruları görüntüleme yetkiniz bulunmuyor.';go('notices');return 'Duyurular sayfasını açtım. Sistemde <b>'+((data?.notices||data?.announcements||[]).length)+'</b> duyuru bulunuyor.';}
    if(/(belge|dokuman|dosya)/.test(q)){if(!allowed('documents_view'))return 'Belgeleri görüntüleme yetkiniz bulunmuyor.';go('docs');return 'Belgeler sayfasını açtım. Buradan izin verilen belgeleri görüntüleyebilir veya indirebilirsiniz.';}
    if(/(mesaj|gelen kutusu)/.test(q)){if(!allowed('messages_view'))return 'Mesajları görüntüleme yetkiniz bulunmuyor.';go('messages');return 'Mesajlar sayfasını açtım.';}
    if(/(yonetici|iletisim|telefon)/.test(q)){if(!allowed('contacts_view'))return 'Yönetici iletişim bilgilerini görüntüleme yetkiniz bulunmuyor.';go('contacts');return 'Yönetici İletişim Bilgileri sayfasını açtım.';}
    if(/(hava|sicaklik|yagmur)/.test(q)){if(!allowed('weather_view'))return 'Hava durumu sayfasını görüntüleme yetkiniz bulunmuyor.';go('weather');return 'Kuşadası Hava Durumu sayfasını açtım.';}
    if(/(fikir|oneri)/.test(q)){if(!allowed('ideas_submit'))return 'Fikirler bölümüne erişim yetkiniz bulunmuyor.';go('ideas');return 'Fikir Paylaş sayfasını açtım. Buradan yeni fikir oluşturabilir ve mevcut fikirleri takip edebilirsiniz.';}
    if(/(excel|pdf|indir)/.test(q)){go('dues');return 'Aidatlar sayfasını açtım. Üst bölümdeki <b>Excel İndir</b> veya <b>PDF İndir</b> düğmesini kullanabilirsiniz. Telefonda dosya uygun görüntüleyiciyle açılır.';}
    if(/(ne yapabilirsin|yardim|nasil kullan)/.test(q))return 'Şunları sorabilirsiniz:<br>• Aidat borcum ne kadar?<br>• Rollerim neler?<br>• Bütçeyi göster<br>• Duyuruları aç<br>• Belgeleri aç<br>• Yönetici iletişim bilgilerini göster<br>• Excel veya PDF nasıl indirilir?';
    return 'Bu soruyu henüz güvenilir şekilde yanıtlayamıyorum. Aidatlar, bütçe, belgeler, duyurular, roller, iletişim ve sayfalara erişim hakkında soru sorabilirsiniz.';
  }

  function addMessage(text,kind){const list=document.querySelector('.asrav-chat-messages');if(!list)return;const div=document.createElement('div');div.className='asrav-chat-message '+kind;div.innerHTML=text;list.appendChild(div);list.scrollTop=list.scrollHeight;}
  function send(){const input=document.getElementById('asravChatInput'),text=input?.value.trim();if(!text)return;input.value='';addMessage(esc(text),'user');setTimeout(()=>addMessage(answer(text),'bot'),180);}
  function mountChat(){
    if(document.getElementById('siteChatbot'))return;
    const host=document.createElement('div');host.id='siteChatbot';host.className='hidden';host.innerHTML='<button class="asrav-chat-launch" aria-label="Asrav Asistanını aç">✦<span>Asistan</span></button><section class="asrav-chat-panel hidden" aria-label="Asrav Asistanı"><header><div><b>Asrav Asistanı</b><small>Site yönetimi yardımcısı</small></div><button class="asrav-chat-close" aria-label="Kapat">×</button></header><div class="asrav-chat-messages"><div class="asrav-chat-message bot">Merhaba! Aidatlar, bütçe, belgeler, duyurular ve sistem kullanımı hakkında bana soru sorabilirsiniz.</div></div><div class="asrav-chat-suggestions"><button>Aidat borcum</button><button>Rollerim</button><button>Yardım</button></div><footer><input id="asravChatInput" placeholder="Sorunuzu yazın…" maxlength="300"><button id="asravChatSend" aria-label="Gönder">➤</button></footer></section>';
    document.body.appendChild(host);
    const launch=host.querySelector('.asrav-chat-launch'),panel=host.querySelector('.asrav-chat-panel');launch.onclick=()=>panel.classList.toggle('hidden');host.querySelector('.asrav-chat-close').onclick=()=>panel.classList.add('hidden');host.querySelector('#asravChatSend').onclick=send;host.querySelector('#asravChatInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send();}};host.querySelectorAll('.asrav-chat-suggestions button').forEach(b=>b.onclick=()=>{host.querySelector('#asravChatInput').value=b.textContent;send();});
  }
  function visibility(){const host=document.getElementById('siteChatbot');if(!host)return;host.classList.toggle('hidden',document.getElementById('app')?.classList.contains('hidden')!==false);}
  mountChat();visibility();new MutationObserver(visibility).observe(document.getElementById('app'),{attributes:true,attributeFilter:['class']});

  const style=document.createElement('style');style.textContent=`
    .pdf-tr th,.pdf-tr td{text-align:center!important;vertical-align:middle!important}
    #siteChatbot{position:fixed;right:22px;bottom:22px;z-index:2800;font-family:inherit}#siteChatbot.hidden{display:none!important}
    .asrav-chat-launch{display:flex;align-items:center;gap:8px;height:54px;padding:0 18px;border:1px solid #075c64;border-radius:28px;background:linear-gradient(135deg,#087f84,#075f69);color:#fff;font-size:20px;font-weight:900;box-shadow:0 12px 30px rgba(7,78,83,.3);cursor:pointer}.asrav-chat-launch span{font-size:13px}
    .asrav-chat-panel{position:absolute;right:0;bottom:68px;width:360px;height:min(520px,calc(100vh - 110px));display:grid;grid-template-rows:auto 1fr auto auto;border:1px solid #c8d9d5;border-radius:20px;background:#fff;box-shadow:0 24px 60px rgba(18,55,60,.28);overflow:hidden}.asrav-chat-panel.hidden{display:none!important}
    .asrav-chat-panel header{display:flex;justify-content:space-between;align-items:center;padding:15px 16px;background:linear-gradient(135deg,#087f84,#075f69);color:#fff}.asrav-chat-panel header div{display:flex;flex-direction:column;gap:2px}.asrav-chat-panel header small{opacity:.82}.asrav-chat-close{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:22px;cursor:pointer}
    .asrav-chat-messages{padding:15px;overflow:auto;background:#f5f8f7}.asrav-chat-message{max-width:86%;margin:0 0 10px;padding:10px 12px;border-radius:14px;font-size:13px;line-height:1.45}.asrav-chat-message.bot{background:#fff;border:1px solid #d7e3e0;color:#244d54;border-bottom-left-radius:4px}.asrav-chat-message.user{margin-left:auto;background:#087f84;color:#fff;border-bottom-right-radius:4px}
    .asrav-chat-suggestions{display:flex;gap:6px;padding:8px 12px;overflow:auto;border-top:1px solid #e2ebe9}.asrav-chat-suggestions button{padding:7px 9px;border:1px solid #bdd3cf;border-radius:14px;background:#f5faf9;color:#22656a;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer}
    .asrav-chat-panel footer{display:grid;grid-template-columns:1fr 42px;gap:8px;padding:11px;border-top:1px solid #e2ebe9}.asrav-chat-panel footer input{min-width:0;height:42px;padding:0 12px;border:1px solid #bfd3cf;border-radius:12px;outline:none}.asrav-chat-panel footer input:focus{border-color:#087f84;box-shadow:0 0 0 3px rgba(8,127,132,.1)}#asravChatSend{border:0;border-radius:12px;background:#087f84;color:#fff;font-size:18px;cursor:pointer}
    @media(max-width:760px){#siteChatbot{right:14px;bottom:max(14px,env(safe-area-inset-bottom))}.asrav-chat-launch{width:52px;padding:0;justify-content:center}.asrav-chat-launch span{display:none}.asrav-chat-panel{position:fixed;left:10px;right:10px;bottom:78px;width:auto;height:min(68dvh,540px);border-radius:18px}}
  `;document.head.appendChild(style);
})();
