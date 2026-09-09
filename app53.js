(()=>{
  const toNum=v=>Math.max(0,Number(v)||0);
  const duePaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');

  function mountDebtEditor(record){
    const body=$('#modalRoot .modal-body'),debt=$('#mPreviousDebt'),amount=$('#mAmount');
    if(!body||!debt||body.dataset.finalDebtEditor==='1')return;
    body.dataset.finalDebtEditor='1';
    const gross=toNum(debt.value),saved=Math.min(gross,toNum(record?.previous_debt_paid_amount ?? (record?.previous_debt_paid?gross:0)));
    body.insertAdjacentHTML('beforeend',`<div class="final-debt-editor">
      <label class="final-check"><input id="mPreviousDebtPaid" type="checkbox" ${gross>0&&saved>=gross?'checked':''} ${gross<=0?'disabled':''}><span>Geçmiş borç ödendi</span></label>
      <div class="final-debt-grid">
        <div class="field"><label>Geçmiş borca ödenen tutar</label><input id="mPreviousDebtPayment" type="number" min="0" step="0.01" value="${saved}"></div>
        <div class="field"><label>Kalan geçmiş borç</label><input id="mPreviousDebtRemaining" readonly></div>
        <div class="field"><label>Toplam borç</label><input id="mTotalDebt" readonly></div>
      </div>
    </div>`);
    const check=$('#mPreviousDebtPaid'),payment=$('#mPreviousDebtPayment'),remaining=$('#mPreviousDebtRemaining'),total=$('#mTotalDebt'),status=$('#mStatus'),current=$('#mCurrentDuePaid');
    check.dataset.fixed='1';check.dataset.previousDebtFixed='1';
    const refresh=source=>{
      const g=toNum(debt.value);
      if(source==='check')payment.value=check.checked?String(g):'0';
      let p=Math.min(g,toNum(payment.value));payment.value=String(p);
      if(source!=='check')check.checked=g>0&&p>=g;
      check.disabled=g<=0;
      const paid=current?current.checked:status?.value==='paid';
      remaining.value=money(Math.max(0,g-p));
      total.value=money((paid?0:toNum(amount.value))+Math.max(0,g-p));
    };
    check.onchange=()=>refresh('check');
    payment.oninput=()=>refresh('payment');
    debt.addEventListener('input',()=>refresh('debt'));
    amount?.addEventListener('input',()=>refresh('amount'));
    status?.addEventListener('change',()=>refresh('status'));
    current?.addEventListener('change',()=>refresh('current'));
    refresh('initial');
  }

  const baseModal=modal;
  modal=(type,record=null)=>{baseModal(type,record);if(type==='due')mountDebtEditor(record)};

  const fallbackSave=saveModal;
  saveModal=async(type,id=null)=>{
    if(type!=='due')return fallbackSave(type,id);
    const period=$('#mPeriod')?.value;
    if(!period)return toast('Dönem seçin.','error');
    const debt=toNum($('#mPreviousDebt')?.value),check=$('#mPreviousDebtPaid'),payment=$('#mPreviousDebtPayment');
    const paidAmount=debt<=0?0:(check?.checked?debt:Math.min(debt,toNum(payment?.value)));
    const current=$('#mCurrentDuePaid')?$('#mCurrentDuePaid').checked:$('#mStatus')?.value==='paid';
    const payload={site_id:SITE,unit_id:+$('#mUnit').value,period:period+'-01',amount:toNum($('#mAmount').value),previous_debt:debt,previous_debt_paid_amount:paidAmount,previous_debt_paid:debt<=0||paidAmount>=debt,due_date:$('#mDue').value,current_due_paid:current,status:current?'paid':'unpaid',paid_at:current?new Date().toISOString():null,created_by:profile.id};
    const villa=unit(payload.unit_id),msg=`${villa} · ${period}\nAidat: ${money(payload.amount)}\nGeçmiş borç: ${money(debt)}\nGeçmiş borç ödemesi: ${money(paidAmount)}\nToplam kalan: ${money((current?0:payload.amount)+Math.max(0,debt-paidAmount))}\n\nBu bilgiler güncellenecektir. Onaylıyor musunuz?`;
    if(!window.confirm(msg))return;
    let result,updated=false;
    if(id){result=await db.from('dues').update(payload).eq('id',id);updated=true}
    else{
      const existing=await db.from('dues').select('id').eq('site_id',SITE).eq('unit_id',payload.unit_id).eq('period',payload.period).maybeSingle();
      if(existing.error)return toast('Aidat kontrol edilemedi: '+existing.error.message,'error');
      if(existing.data){result=await db.from('dues').update(payload).eq('id',existing.data.id);updated=true}else result=await db.from('dues').insert(payload);
    }
    if(result.error)return toast('Aidat güncellenemedi: '+result.error.message,'error');
    $('#modalRoot').innerHTML='';toast(updated?'Aidat ve geçmiş borç güncellendi.':'Aidat kaydedildi.');await loadAll();
  };

  let logs={page:1,total:0,rows:[],search:'',event:'',from:'',to:''};
  function logMarkup(){return `<section id="finalLoginLogs" class="panel final-login-logs"><div class="panel-head"><div><h3>Giriş Kayıtları</h3><p>Tüm kayıtlar kalıcıdır ve 100’erli sayfalarda gösterilir.</p></div></div><div class="final-log-filters"><input id="flSearch" placeholder="Kullanıcı adı, e-posta veya cihaz" value="${esc(logs.search)}"><select id="flEvent"><option value="">Tüm olaylar</option><option value="login" ${logs.event==='login'?'selected':''}>Giriş</option><option value="signup" ${logs.event==='signup'?'selected':''}>Yeni kullanıcı</option></select><input id="flFrom" type="date" value="${esc(logs.from)}"><input id="flTo" type="date" value="${esc(logs.to)}"><button class="primary" id="flApply">Filtrele</button><button class="ghost" id="flClear">Temizle</button></div><div id="flResults"><div class="final-log-loading">Kayıtlar yükleniyor…</div></div></section>`}
  function logTable(){
    if(!logs.rows.length)return '<div class="empty">Filtreye uygun kayıt bulunamadı.</div>';
    const count=Math.max(1,Math.ceil(logs.total/100)),first=(logs.page-1)*100+1,last=Math.min(logs.page*100,logs.total),buttons=[];
    for(let i=Math.max(1,logs.page-2);i<=Math.min(count,logs.page+2);i++)buttons.push(`<button data-final-log-page="${i}" class="${i===logs.page?'active':''}">${i}</button>`);
    return `<div class="final-log-count">Toplam <b>${logs.total}</b> kalıcı kayıt · ${first}–${last}</div><div class="table-wrap"><table class="final-log-table"><thead><tr><th>Kullanıcı Adı</th><th>E-posta</th><th>Olay</th><th>Tarih ve Saat</th><th>Cihaz</th></tr></thead><tbody>${logs.rows.map(x=>`<tr><td><b>${esc(x.full_name||'Bilinmiyor')}</b></td><td>${esc(x.email||'—')}</td><td>${x.event_type==='signup'?'Yeni kullanıcı':'Giriş'}</td><td>${new Date(x.created_at).toLocaleString('tr-TR')}</td><td><small>${esc((x.user_agent||'—').slice(0,120))}</small></td></tr>`).join('')}</tbody></table></div><div class="final-log-pages"><button data-final-log-page="${logs.page-1}" ${logs.page<=1?'disabled':''}>← Önceki</button>${buttons.join('')}<button data-final-log-page="${logs.page+1}" ${logs.page>=count?'disabled':''}>Sonraki →</button><span>Sayfa ${logs.page} / ${count}</span></div>`;
  }
  async function loadLogs(){
    const box=$('#flResults');if(!box)return;box.innerHTML='<div class="final-log-loading">Kayıtlar yükleniyor…</div>';
    const r=await db.rpc('get_login_logs',{p_page:logs.page,p_page_size:100,p_search:logs.search||null,p_event_type:logs.event||null,p_date_from:logs.from||null,p_date_to:logs.to||null});
    if(r.error){box.innerHTML='<div class="empty">Giriş kayıtları yüklenemedi: '+esc(r.error.message)+'</div>';return}
    logs.rows=r.data||[];logs.total=+(logs.rows[0]?.total_count||0);box.innerHTML=logTable();
    $$('[data-final-log-page]').forEach(b=>b.onclick=()=>{const p=+b.dataset.finalLogPage,count=Math.max(1,Math.ceil(logs.total/100));if(p<1||p>count||p===logs.page)return;logs.page=p;loadLogs()});
  }
  function mountLogs(){
    if(page!=='admin'||profile?.role!=='admin'||$('#finalLoginLogs'))return;
    const old=$('#persistentLoginLogs')||$('#loginAuditDetails')||$('.login-log-launch')||$('.persistent-login-launch')||[...$$('#content h2')].find(x=>x.textContent.trim()==='Giriş Kayıtları')?.closest('section');
    if(!old)return;old.outerHTML=logMarkup();
    $('#flApply').onclick=()=>{logs.search=$('#flSearch').value.trim();logs.event=$('#flEvent').value;logs.from=$('#flFrom').value;logs.to=$('#flTo').value;logs.page=1;loadLogs()};
    $('#flClear').onclick=()=>{logs={page:1,total:0,rows:[],search:'',event:'',from:'',to:''};render()};
    $('#flSearch').onkeydown=e=>{if(e.key==='Enter')$('#flApply').click()};loadLogs();
  }
  const priorRender=render;
  render=()=>{const r=priorRender();mountLogs();return r};
  const style=document.createElement('style');style.textContent='.final-debt-editor{margin-top:12px;padding:14px;border:1px solid var(--line);border-radius:12px;background:#f8fbfa}.final-check{display:flex!important;align-items:center;gap:8px;font-weight:800;margin-bottom:11px}.final-debt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.final-debt-grid input[readonly]{background:#eaf4f2;font-weight:800}.final-login-logs{margin-top:16px}.final-login-logs p{margin:3px 0 0;color:#365860;font-weight:620}.final-log-filters{display:grid;grid-template-columns:minmax(220px,1fr) 140px 140px 140px auto auto;gap:7px;padding:13px;border-top:1px solid var(--line)}.final-log-count{padding:11px 13px;color:#365860}.final-log-table{min-width:850px}.final-log-pages{display:flex;justify-content:center;align-items:center;gap:5px;flex-wrap:wrap;padding:13px}.final-log-pages button{height:31px;min-width:32px;border:1px solid var(--line);background:#fff;border-radius:7px;font-weight:750}.final-log-pages button.active{background:#0492C2;color:#fff}.final-log-loading{padding:32px;text-align:center}@media(max-width:850px){.final-debt-grid{grid-template-columns:1fr}.final-log-filters{grid-template-columns:1fr 1fr}.final-log-filters input:first-child{grid-column:1/3}}';document.head.appendChild(style);
})();
