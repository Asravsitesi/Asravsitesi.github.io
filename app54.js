(()=>{
  const n=v=>Math.max(0,Number(v)||0);
  const currentPaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');
  const oldPaid=d=>Math.max(0,Math.min(n(d?.previous_debt),d?.previous_debt_paid_amount==null?(d?.previous_debt_paid?n(d?.previous_debt):0):n(d?.previous_debt_paid_amount)));
  function state(d){
    const due=n(d?.amount),old=n(d?.previous_debt),paid=(currentPaid(d)?due:0)+oldPaid(d),total=due+old;
    if(total<=0||paid>=total)return{label:'Ödendi',value:'paid',cls:'paid'};
    if(paid>0)return{label:'Kısmi ödeme',value:'pending',cls:'pending'};
    const deadline=d?.due_date?new Date(String(d.due_date).slice(0,10)+'T23:59:59'):null;
    return{label:deadline&&deadline<new Date()?'Gecikmiş / Ödenmedi':'Ödenmedi',value:'unpaid',cls:'unpaid'};
  }
  function patchStatuses(){
    if(page!=='dues')return;
    const table=$('#rows');if(!table)return;
    const headers=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim()),statusIndex=headers.indexOf('Durum');if(statusIndex<0)return;
    const option=$('#fStatus option[value="pending"]');if(option)option.textContent='Kısmi ödeme';
    [...table.querySelectorAll('tbody tr')].forEach((tr,i)=>{
      if(tr.classList.contains('missing-due-row'))return;
      const d=tr.dataset.dueId?(data.dues||[]).find(x=>String(x.id)===tr.dataset.dueId):(data.dues||[])[i];if(!d)return;
      const s=state(d),cell=tr.children[statusIndex];tr.dataset.status=s.value;
      if(cell&&cell.textContent.trim()!==s.label)cell.innerHTML='<span class="badge '+s.cls+'">'+s.label+'</span>';
    });
  }

  let logs={page:1,total:0,rows:[],search:'',event:'',from:'',to:''};
  function shell(){return `<section class="panel login-logs-2562" id="loginLogs2562"><div class="panel-head"><div><h3>Giriş Kayıtları</h3><p>Tüm giriş kayıtları kalıcıdır. Her sayfada en fazla 100 kayıt gösterilir.</p></div></div><div class="logs-filter-2562"><input id="lgSearch2562" placeholder="Kullanıcı adı, e-posta veya cihaz" value="${esc(logs.search)}"><select id="lgEvent2562"><option value="">Tüm olaylar</option><option value="login" ${logs.event==='login'?'selected':''}>Giriş</option><option value="signup" ${logs.event==='signup'?'selected':''}>Yeni kullanıcı</option></select><input id="lgFrom2562" type="date" value="${esc(logs.from)}"><input id="lgTo2562" type="date" value="${esc(logs.to)}"><button class="primary" id="lgApply2562">Filtrele</button><button class="ghost" id="lgClear2562">Temizle</button></div><div id="lgResults2562"><div class="logs-loading-2562">Kayıtlar yükleniyor…</div></div></section>`}
  function table(){
    if(!logs.rows.length)return '<div class="empty">Filtreye uygun giriş kaydı bulunamadı.</div>';
    const pages=Math.max(1,Math.ceil(logs.total/100)),first=(logs.page-1)*100+1,last=Math.min(logs.page*100,logs.total),nums=[];
    for(let p=Math.max(1,logs.page-2);p<=Math.min(pages,logs.page+2);p++)nums.push(`<button data-lg-page="${p}" class="${p===logs.page?'active':''}">${p}</button>`);
    return `<div class="logs-count-2562">Toplam <b>${logs.total}</b> kalıcı kayıt · ${first}–${last} arası gösteriliyor</div><div class="table-wrap"><table class="logs-table-2562"><thead><tr><th>Kullanıcı Adı</th><th>E-posta</th><th>Olay</th><th>Tarih ve Saat</th><th>Cihaz</th></tr></thead><tbody>${logs.rows.map(r=>`<tr><td><b>${esc(r.full_name||'Bilinmiyor')}</b></td><td>${esc(r.email||'—')}</td><td>${r.event_type==='signup'?'Yeni kullanıcı':'Giriş'}</td><td>${new Date(r.created_at).toLocaleString('tr-TR')}</td><td><small>${esc((r.user_agent||'—').slice(0,120))}</small></td></tr>`).join('')}</tbody></table></div><div class="logs-pages-2562"><button data-lg-page="${logs.page-1}" ${logs.page<=1?'disabled':''}>← Önceki</button>${nums.join('')}<button data-lg-page="${logs.page+1}" ${logs.page>=pages?'disabled':''}>Sonraki →</button><span>Sayfa ${logs.page} / ${pages}</span></div>`;
  }
  async function loadLogs(){
    const box=$('#lgResults2562');if(!box)return;box.innerHTML='<div class="logs-loading-2562">Kayıtlar yükleniyor…</div>';
    const r=await db.rpc('get_login_logs',{p_page:logs.page,p_page_size:100,p_search:logs.search||null,p_event_type:logs.event||null,p_date_from:logs.from||null,p_date_to:logs.to||null});
    if(r.error){box.innerHTML='<div class="empty">Giriş kayıtları yüklenemedi: '+esc(r.error.message)+'</div>';return}
    logs.rows=r.data||[];logs.total=+(logs.rows[0]?.total_count||0);box.innerHTML=table();
    $$('[data-lg-page]').forEach(b=>b.onclick=()=>{const p=+b.dataset.lgPage,pages=Math.max(1,Math.ceil(logs.total/100));if(p<1||p>pages||p===logs.page)return;logs.page=p;loadLogs()});
  }
  function mountLogs(){
    if(page!=='admin'||profile?.role!=='admin'||$('#loginLogs2562'))return;
    const candidates=['#finalLoginLogs','#persistentLoginLogs','#loginAuditDetails','.login-log-launch','.persistent-login-launch'];
    candidates.forEach(q=>$$(q).forEach(x=>x.remove()));
    [...$$('#content h2')].filter(x=>x.textContent.trim()==='Giriş Kayıtları').forEach(x=>x.closest('section')?.remove());
    const host=$('.admin-stack')||$('#content');host.insertAdjacentHTML('beforeend',shell());
    $('#lgApply2562').onclick=()=>{logs.search=$('#lgSearch2562').value.trim();logs.event=$('#lgEvent2562').value;logs.from=$('#lgFrom2562').value;logs.to=$('#lgTo2562').value;logs.page=1;loadLogs()};
    $('#lgClear2562').onclick=()=>{logs={page:1,total:0,rows:[],search:'',event:'',from:'',to:''};$('#loginLogs2562').remove();mountLogs()};
    $('#lgSearch2562').onkeydown=e=>{if(e.key==='Enter')$('#lgApply2562').click()};loadLogs();
  }
  const oldRender=render;
  render=()=>{const r=oldRender();patchStatuses();mountLogs();return r};
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{patchStatuses();mountLogs()},25)}).observe($('#content'),{childList:true,subtree:true});
  const style=document.createElement('style');style.textContent='.badge.pending{background:#fff1d7!important;color:#8b5a13!important}.login-logs-2562{margin-top:16px}.login-logs-2562 p{margin:3px 0 0;color:#365860;font-weight:620}.logs-filter-2562{display:grid;grid-template-columns:minmax(220px,1fr) 140px 140px 140px auto auto;gap:7px;padding:13px;border-top:1px solid var(--line)}.logs-count-2562{padding:11px 13px;color:#365860}.logs-table-2562{min-width:850px}.logs-pages-2562{display:flex;justify-content:center;align-items:center;gap:5px;flex-wrap:wrap;padding:13px}.logs-pages-2562 button{height:31px;min-width:32px;border:1px solid var(--line);background:#fff;border-radius:7px;font-weight:750}.logs-pages-2562 button.active{background:#0492C2;color:#fff}.logs-loading-2562{padding:32px;text-align:center}@media(max-width:850px){.logs-filter-2562{grid-template-columns:1fr 1fr}.logs-filter-2562 input:first-child{grid-column:1/3}}';document.head.appendChild(style);
})();
