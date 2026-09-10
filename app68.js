(()=>{
  const currentPaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');
  const previousPaid=d=>{
    const debt=Math.max(0,Number(d?.previous_debt)||0);
    const paid=Math.max(0,Number(d?.previous_debt_paid_amount)||0);
    return debt>0&&(d?.previous_debt_paid===true||paid>=debt);
  };
  const shortDate=value=>value?new Date(value).toLocaleDateString('tr-TR'):'—';
  const fullDate=value=>value?new Date(value).toLocaleString('tr-TR'):'—';
  function paymentDateHtml(d){
    const items=[];
    if(currentPaid(d)&&d.paid_at)items.push('<span class="payment-date-entry" title="'+esc(fullDate(d.paid_at))+'"><small>Aidat</small><b>'+esc(shortDate(d.paid_at))+'</b></span>');
    if(previousPaid(d)&&d.previous_debt_paid_at)items.push('<span class="payment-date-entry previous" title="'+esc(fullDate(d.previous_debt_paid_at))+'"><small>Geçmiş borç</small><b>'+esc(shortDate(d.previous_debt_paid_at))+'</b></span>');
    return items.length?'<div class="payment-date-list">'+items.join('')+'</div>':'<span class="payment-date-empty">—</span>';
  }
  function patchPaymentDates(){
    if(page!=='dues')return;
    const table=$('#rows');if(!table)return;
    const headRow=table.querySelector('thead tr');if(!headRow)return;
    let header=headRow.querySelector('.payment-date-header');
    if(!header){
      const status=[...headRow.children].find(x=>x.textContent.trim()==='Durum');
      if(!status)return;
      header=document.createElement('th');header.className='payment-date-header';header.textContent='Ödeme Tarihi';status.after(header);
    }
    const paymentIndex=[...headRow.children].indexOf(header);
    [...table.querySelectorAll('tbody tr')].forEach((tr,rowIndex)=>{
      if(tr.classList.contains('missing-due-row')){
        const merged=tr.querySelector('td[colspan]');
        if(merged&&!merged.dataset.paymentDateSpan){merged.colSpan=Number(merged.colSpan||5)+1;merged.dataset.paymentDateSpan='1'}
        return;
      }
      const d=tr.dataset.dueId?(data.dues||[]).find(x=>String(x.id)===String(tr.dataset.dueId)):(data.dues||[])[rowIndex];
      if(!d)return;
      let cell=tr.querySelector('.payment-date-cell');
      if(!cell){cell=document.createElement('td');cell.className='payment-date-cell';const before=tr.children[paymentIndex];before?tr.insertBefore(cell,before):tr.appendChild(cell)}
      const html=paymentDateHtml(d);if(cell.innerHTML!==html)cell.innerHTML=html;
    });
  }
  const previousRender=render;
  render=function(){const result=previousRender();patchPaymentDates();return result};
  let timer;
  new MutationObserver(()=>{if(page!=='dues')return;clearTimeout(timer);timer=setTimeout(patchPaymentDates,20)}).observe($('#content'),{childList:true,subtree:true});
  const style=document.createElement('style');
  style.textContent=`.payment-date-header,.payment-date-cell{min-width:145px;width:145px}.payment-date-list{display:grid;gap:5px}.payment-date-entry{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:3px 7px;padding:6px 8px;border:1px solid #b9ddd0;border-radius:9px;background:#eff9f5;color:#226b57;white-space:nowrap}.payment-date-entry small{font-size:9px;color:#55776d}.payment-date-entry b{font-size:11px}.payment-date-entry.previous{border-color:#bdd7e3;background:#f0f8fb;color:#21627a}.payment-date-empty{color:#91a29e}@media(max-width:760px){.payment-date-header,.payment-date-cell{min-width:132px!important;width:132px!important}.payment-date-entry{grid-template-columns:1fr;gap:2px;padding:7px}.payment-date-entry small{font-size:8.5px}.payment-date-entry b{font-size:11px}.payment-date-list{gap:4px}}`;
  document.head.appendChild(style);
  patchPaymentDates();
})();
