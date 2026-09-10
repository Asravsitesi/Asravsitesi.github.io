(()=>{
  const roleNames={admin:'Admin',manager:'Yönetici',owner:'Ev Sahibi',tenant:'Kiracı',resident:'Atama Bekliyor'};
  const permNames=typeof permissionLabels==='object'?permissionLabels:{};
  const normalize=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tl=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n)||0);
  const date=v=>v?new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}):'—';
  const rows=k=>Array.isArray(data?.[k])?data[k]:[];
  const myRoles=()=>[...new Set(Array.isArray(profile?.roles)&&profile.roles.length?profile.roles:[profile?.role||'resident'])];
  const admin=()=>profile?.role==='admin'||myRoles().includes('admin');
  const can=p=>admin()||(typeof has==='function'&&has(p));
  const pageAllowed=p=>{try{return typeof canOpenPage==='function'&&canOpenPage(p)}catch{return false}};
  const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'');
  const duePaid=d=>d.current_due_paid===true||(d.current_due_paid==null&&d.status==='paid');
  const oldGross=d=>Math.max(0,Number(d.previous_debt)||0);
  const oldPaid=d=>Math.max(0,Math.min(oldGross(d),Number(d.previous_debt_paid_amount!=null?d.previous_debt_paid_amount:(d.previous_debt_paid?oldGross(d):0))||0));
  const dueLeft=d=>(duePaid(d)?0:Number(d.amount)||0)+Math.max(0,oldGross(d)-oldPaid(d));
  const villaFrom=q=>{const m=q.match(/(?:villa|daire)\s*(\d{1,2})/i);return m?Number(m[1]):null};
  const yearFrom=q=>{const m=q.match(/\b(20(?:2\d|3\d|40))\b/);return m?m[1]:null};
  const months={ocak:'01',subat:'02',mart:'03',nisan:'04',mayis:'05',haziran:'06',temmuz:'07',agustos:'08',eylul:'09',ekim:'10',kasim:'11',aralik:'12'};
  const monthFrom=q=>Object.entries(months).find(([n])=>q.includes(n))?.[1]||null;
  function openPage(name){const b=document.querySelector('#nav [data-page="'+name+'"]');if(!b||b.classList.contains('hidden')||!pageAllowed(name))return false;b.click();return true}
  function roleSummary(){return myRoles().map(r=>roleNames[r]||r).join(', ')}
  function permissionSummary(){const map=permissionMap?.[profile?.role]||{},active=Object.keys(map).filter(k=>map[k]===true).map(k=>permNames[k]||k);return admin()?'Admin rolü nedeniyle sistemdeki tüm yetkiler etkin.':active.length?'Etkin yetkileriniz: '+active.join(', ')+'.':'Bu rol için ek işlem yetkisi tanımlanmamış.'}
  function accessiblePages(){const names={dashboard:'Genel Bakış',dues:'Aidatlar',budgets:'Bütçe',docs:'Belgeler',notices:'Duyurular',weather:'Hava Durumu',news:'Kuşadası Haberler',contacts:'Yönetici İletişim Bilgileri',residentContacts:'Site Sakinleri',ideas:'Fikirler',messages:'Mesajlar',backup:'Yedekleme Merkezi',admin:'Kişi ve Yetki Yönetimi',settings:'Hesabım'};return Object.entries(names).filter(([k])=>k==='settings'||pageAllowed(k)).map(([,v])=>v)}

  function answerDues(q){
    if(!can('dues_view'))return 'Aidat bilgilerini görüntüleme yetkiniz bulunmuyor.';
    let list=rows('dues'),villa=villaFrom(q),year=yearFrom(q),month=monthFrom(q);
    if(!admin()&&!can('dues_manage'))villa=Number(profile?.unit_id)||villa;
    if(villa)list=list.filter(d=>String(d.unit_id)===String(villa));if(year)list=list.filter(d=>String(d.period||'').slice(0,4)===year);if(month)list=list.filter(d=>String(d.period||'').slice(5,7)===month);
    if(/odenmemis|gecikmis|borclu|acik/.test(q))list=list.filter(d=>dueLeft(d)>0);if(/odenmis|kapali/.test(q)&&!/odenmemis/.test(q))list=list.filter(d=>dueLeft(d)<=0);
    const total=list.reduce((s,d)=>s+dueLeft(d),0),current=list.reduce((s,d)=>s+(duePaid(d)?0:Number(d.amount)||0),0),old=list.reduce((s,d)=>s+Math.max(0,oldGross(d)-oldPaid(d)),0),open=list.filter(d=>dueLeft(d)>0).length;
    if(/odeme tarihi|ne zaman odendi/.test(q)){const paid=list.filter(d=>d.paid_at||d.previous_debt_paid_at).slice(0,8);return paid.length?paid.map(d=>'<b>'+safe(unit(d.unit_id))+' · '+safe(String(d.period||'').slice(0,7))+'</b>: Aidat '+safe(date(d.paid_at))+', geçmiş borç '+safe(date(d.previous_debt_paid_at))).join('<br>'):'Bu filtreye uygun ödeme tarihi bulunamadı.'}
    return (villa?'<b>Villa '+villa+'</b>':'Görüntüleme yetkinizdeki kayıtlar')+(year?' · '+year:'')+(month?' · ay '+month:'')+' için toplam kalan borç <b>'+safe(tl(total))+'</b>. Güncel aidat borcu '+safe(tl(current))+', geçmiş borç '+safe(tl(old))+', açık kayıt sayısı <b>'+open+'</b>.';
  }
  function answerBudget(q){
    if(!can('budgets_view'))return 'Bütçe bilgilerini görüntüleme yetkiniz bulunmuyor.';let list=rows('budgets'),year=yearFrom(q);if(year)list=list.filter(x=>String(x.year)===year);const planned=list.reduce((s,x)=>s+(Number(x.planned)||0),0),spent=list.reduce((s,x)=>s+(Number(x.spent)||0),0),left=planned-spent;
    const match=list.filter(x=>q.split(/\s+/).some(w=>w.length>4&&normalize(x.name).includes(w))).slice(0,5);return 'Planlanan toplam <b>'+safe(tl(planned))+'</b>, harcanan <b>'+safe(tl(spent))+'</b>, bütçe farkı <b>'+safe(tl(left))+'</b>.'+(match.length?'<br>'+match.map(x=>safe(x.name)+': '+safe(tl(x.spent))+' / '+safe(tl(x.planned))).join('<br>'):'');
  }
  function answerDocuments(q){if(!can('documents_view'))return 'Belgeleri görüntüleme yetkiniz bulunmuyor.';const list=rows('documents'),found=list.filter(x=>normalize((x.name||'')+' '+(x.category||'')).split(/\s+/).some(w=>q.includes(w)&&w.length>3)).slice(0,6),show=found.length?found:list.slice(0,6);return '<b>'+list.length+'</b> belgeye erişiminiz var.'+(show.length?'<br>'+show.map(x=>'• '+safe(x.name)+' — '+safe(x.category||'Kategori yok')).join('<br>'):'');}
  function answerNotices(q){if(!can('announcements_view'))return 'Duyuruları görüntüleme yetkiniz bulunmuyor.';const list=rows('announcements'),found=list.filter(x=>normalize((x.title||'')+' '+(x.body||'')).split(/\s+/).some(w=>q.includes(w)&&w.length>4)).slice(0,5),show=found.length?found:list.slice(0,5);return list.length?show.map(x=>'<b>'+safe(x.title)+'</b> · '+safe(date(x.created_at))+'<br>'+safe(String(x.body||'').slice(0,220))).join('<br><br>'):'Henüz duyuru bulunmuyor.';}
  function answerResidents(q){if(!can('residents_contacts_view'))return 'Site sakinlerinin bilgilerini görüntüleme yetkiniz bulunmuyor.';const villa=villaFrom(q),profiles=rows('profiles').filter(p=>!villa||String(p.unit_id)===String(villa)),manual=rows('residentContacts').filter(p=>!villa||String(p.unit_id)===String(villa));const combined=[...profiles,...manual];if(villa)return combined.length?combined.map(p=>'<b>'+safe(p.full_name||p.email||'Sakin')+'</b> — '+safe((Array.isArray(p.roles)?p.roles:[p.role||p.resident_role]).map(r=>roleNames[r]||r).join(', '))).join('<br>'):'Villa '+villa+' için sakin kaydı bulunmuyor.';return 'Erişebildiğiniz <b>'+combined.length+'</b> sakin kaydı bulunuyor. Dolu villa sayısı: <b>'+new Set(combined.map(p=>p.unit_id).filter(Boolean)).size+'</b>.';}
  function answerContacts(){if(!can('contacts_view'))return 'Yönetici iletişim bilgilerini görüntüleme yetkiniz bulunmuyor.';const managers=rows('profiles').filter(p=>(Array.isArray(p.roles)?p.roles:[p.role]).some(r=>r==='admin'||r==='manager'));return managers.length?managers.map(p=>'<b>'+safe(p.full_name||p.email)+'</b> — '+safe(p.email||'')+(p.phone?' · '+safe(p.phone):'')).join('<br>'):'Görüntülenebilir yönetici kaydı bulunmuyor.';}
  function answerIdeas(){if(!can('ideas_submit')&&!can('ideas_view'))return 'Fikirler bölümüne erişim yetkiniz bulunmuyor.';const list=rows('ideas'),mine=list.filter(x=>x.created_by===profile?.id),assigned=list.filter(x=>x.assigned_to===profile?.id),status={};list.forEach(x=>status[x.status||'Bekliyor']=(status[x.status||'Bekliyor']||0)+1);return 'Toplam <b>'+list.length+'</b> fikir var. Sizin oluşturduklarınız: <b>'+mine.length+'</b>, size atananlar: <b>'+assigned.length+'</b>.<br>'+Object.entries(status).map(([k,v])=>safe(k)+': '+v).join(' · ');}
  function answerMessages(){if(!can('messages_view'))return 'Mesajları görüntüleme yetkiniz bulunmuyor.';const list=rows('messages'),unread=list.filter(x=>x.is_read===false||x.read_at==null&&x.recipient_id===profile?.id);return 'Erişebildiğiniz <b>'+list.length+'</b> mesaj bulunuyor. Okunmamış mesaj sayısı: <b>'+unread.length+'</b>.'+(list.length?'<br>'+list.slice(0,5).map(x=>'• '+safe(x.subject||x.title||'Mesaj')).join('<br>'):'');}
  function answerAdmin(q){if(!admin())return 'Bu bilgi yalnızca admin rolüyle görüntülenebilir.';if(/giris|oturum/.test(q)){const list=rows('loginLogs');return 'Yüklenen son giriş kayıtlarının sayısı: <b>'+list.length+'</b>.'+(list[0]?'<br>Son kayıt: '+safe(date(list[0].created_at)):'');}if(/hata|log/.test(q)){const list=rows('applicationErrors');return 'Yüklenen uygulama hata kaydı sayısı: <b>'+list.length+'</b>. Ayrıntılar için Sistem Sınırları ekranını kullanın.';}return permissionSummary();}
  function searchPermitted(q){const hits=[];const add=(source,list,fields,perm)=>{if(perm&&!can(perm))return;list.forEach(x=>{const text=fields.map(f=>x[f]||'').join(' ');if(q.split(/\s+/).some(w=>w.length>4&&normalize(text).includes(w)))hits.push({source,text});});};add('Duyuru',rows('announcements'),['title','body'],'announcements_view');add('Belge',rows('documents'),['name','category'],'documents_view');add('Bütçe',rows('budgets'),['name','year'],'budgets_view');add('Fikir',rows('ideas'),['title','description','details'],'ideas_view');return hits.slice(0,6).map(h=>'<b>'+h.source+':</b> '+safe(h.text.slice(0,240))).join('<br>');}

  function answer(question){
    const q=normalize(question);
    if(!q)return 'Lütfen siteyle ilgili sorunuzu yazın.';
    if(/^(merhaba|selam|gunaydin|iyi aksamlar)/.test(q))return 'Merhaba '+safe(profile?.full_name||'')+'! Size yalnızca rolünüzün izin verdiği site bilgileriyle yardımcı olacağım.';
    if(/(kimim|rol|yetki|neye erisebilirim|hangi sayfa)/.test(q))return '<b>Rolleriniz:</b> '+safe(roleSummary())+'<br>'+safe(permissionSummary())+'<br><b>Erişebildiğiniz sayfalar:</b> '+safe(accessiblePages().join(', '));
    if(/(aidat|borc|tahsilat|odeme tarihi|gecikmis)/.test(q))return answerDues(q);
    if(/(butce|harcama|planlanan|birikim|kasa)/.test(q))return answerBudget(q);
    if(/(belge|dokuman|dosya|dekont)/.test(q))return answerDocuments(q);
    if(/(duyuru|ilan)/.test(q))return answerNotices(q);
    if(/(site sakini|sakinler|kim oturuyor|dolu villa|bos villa)/.test(q))return answerResidents(q);
    if(/(yonetici|iletisim|telefon|e-posta)/.test(q))return answerContacts();
    if(/(fikir|oneri|atanan)/.test(q))return answerIdeas();
    if(/(mesaj|gelen kutusu|okunmamis)/.test(q))return answerMessages();
    if(/(giris kaydi|oturum kaydi|sistem hatasi|hata kaydi|log)/.test(q))return answerAdmin(q);
    if(/(yedek|geri yukle)/.test(q)){if(!admin())return 'Yedekleme Merkezi yalnızca admin rolüne açıktır.';openPage('backup');return 'Yedekleme Merkezi sayfasını açtım.';}
    if(/(hava|sicaklik|yagmur)/.test(q)){if(!can('weather_view'))return 'Hava durumu sayfasına erişim yetkiniz bulunmuyor.';openPage('weather');return 'Kuşadası Hava Durumu sayfasını açtım.';}
    if(/(haber|kusadasi)/.test(q)){openPage('news');return 'Kuşadası Haberler sayfasını açtım.';}
    if(/(excel|pdf|indir|rapor)/.test(q)){if(!can('dues_view'))return 'Aidat raporlarını indirme erişiminiz bulunmuyor.';openPage('dues');return 'Aidatlar sayfasını açtım. Excel İndir veya PDF İndir düğmesini kullanabilirsiniz.';}
    if(/(nasil kullan|yardim|ne sorabilirim|ne yapabilirsin)/.test(q))return 'Rolünüze göre aidatlar, ödeme tarihleri, geçmiş borçlar, bütçe, belgeler, duyurular, sakinler, yöneticiler, fikirler, mesajlar, hava durumu, haberler ve sistem kullanımı hakkında soru sorabilirsiniz. Örnek: “Villa 8 borcu”, “2026 ödenmemiş aidatlar”, “son duyurular”, “rollerim ve yetkilerim”.';
    const result=searchPermitted(q);return result||'Bu soruyla eşleşen, rolünüz kapsamında görüntülenebilir bir site kaydı bulamadım. Konuyu aidat, bütçe, belge, duyuru, sakin, yönetici, fikir veya mesaj olarak belirterek tekrar sorabilirsiniz.';
  }

  document.getElementById('siteChatbot')?.remove();
  const host=document.createElement('div');host.id='siteChatbot';host.className=document.getElementById('app')?.classList.contains('hidden')?'hidden':'';host.innerHTML='<button class="asrav-chat-launch" aria-label="Asrav Asistanını aç">✦<span>Asistan</span></button><section class="asrav-chat-panel hidden" aria-label="Asrav Asistanı"><header><div><b>Asrav Asistanı</b><small>Rolünüze göre güvenli yanıtlar</small></div><button class="asrav-chat-close" aria-label="Kapat">×</button></header><div class="asrav-chat-messages"><div class="asrav-chat-message bot">Merhaba! Siteyle ilgili sorunuzu yazın. Yalnızca rolünüzün izin verdiği bilgileri kullanacağım.</div></div><div class="asrav-chat-suggestions"><button>Villa 8 borcu</button><button>Son duyurular</button><button>Rollerim ve yetkilerim</button></div><footer><input id="asravChatInput" placeholder="Siteyle ilgili sorunuzu yazın…" maxlength="500"><button id="asravChatSend" aria-label="Gönder">➤</button></footer></section>';document.body.appendChild(host);
  const messages=host.querySelector('.asrav-chat-messages'),input=host.querySelector('#asravChatInput'),panel=host.querySelector('.asrav-chat-panel');
  function add(text,type){const e=document.createElement('div');e.className='asrav-chat-message '+type;e.innerHTML=text;messages.appendChild(e);messages.scrollTop=messages.scrollHeight;}
  function send(){const text=input.value.trim();if(!text)return;input.value='';add(safe(text),'user');setTimeout(()=>add(answer(text),'bot'),160)}
  host.querySelector('.asrav-chat-launch').onclick=()=>panel.classList.toggle('hidden');host.querySelector('.asrav-chat-close').onclick=()=>panel.classList.add('hidden');host.querySelector('#asravChatSend').onclick=send;input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send()}};host.querySelectorAll('.asrav-chat-suggestions button').forEach(b=>b.onclick=()=>{input.value=b.textContent;send()});
})();
