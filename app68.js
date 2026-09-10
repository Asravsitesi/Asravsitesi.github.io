(()=>{
  const currentPaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');
  const previousPaid=d=>{
    const debt=Math.max(0,Number(d?.previous_debt)||0),paid=Math.max(0,Number(d?.previous_debt_paid_amount)||0);
    return debt>0&&(d?.previous_debt_paid===true||paid>=debt);
  };
  const shortDate=value=>value?new Date(value).toLocaleDateString('tr-TR'):'—';
  const fullDate=value=>value?new Date(value).toLocaleString('tr-TR'):'—';
  function paymentDateHtml(d){
    const items=[];
    if(currentPaid(d)&&d.paid_at)items.push('<span title="Aidat · '+esc(fullDate(d.paid_at))+'"><i>A</i>'+esc(shortDate(d.paid_at))+'</span>');
    if(previousPaid(d)&&d.previous_debt_paid_at)items.push('<span title="Geçmiş borç · '+esc(fullDate(d.previous_debt_paid_at))+'"><i>G</i>'+esc(shortDate(d.previous_debt_paid_at))+'</span>');
    return items.length?'<div class="payment-date-inline"><small>Ödeme tarihi</small>'+items.join('')+'</div>':'';
  }
  function removeOldPaymentColumn(table){
    const header=table.querySelector('.payment-date-header');
    if(header)header.remove();
    table.querySelectorAll('.payment-date-cell').forEach(x=>x.remove());
    table.querySelectorAll('.missing-due-row td[data-payment-date-span]').forEach(x=>{
      x.colSpan=Math.max(1,Number(x.colSpan||6)-1);
      delete x.dataset.paymentDateSpan;
    });
  }
  function patchPaymentDates(){
    if(page!=='dues')return;
    const table=$('#rows');if(!table)return;
    removeOldPaymentColumn(table);
    const headers=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
    const dueDateIndex=headers.indexOf('Son ödeme');if(dueDateIndex<0)return;
    [...table.querySelectorAll('tbody tr')].forEach((tr,rowIndex)=>{
      if(tr.classList.contains('missing-due-row'))return;
      const d=tr.dataset.dueId?(data.dues||[]).find(x=>String(x.id)===String(tr.dataset.dueId)):(data.dues||[])[rowIndex];
      const cell=tr.children[dueDateIndex];if(!d||!cell)return;
      cell.querySelector('.payment-date-inline')?.remove();
      const html=paymentDateHtml(d);if(html)cell.insertAdjacentHTML('beforeend',html);
    });
  }
  function removeDuplicateMobileClose(){
    if(innerWidth<=760)$('#modalRoot .reminder-modal .modal-head .close')?.remove();
  }
  const previousRender=render;
  render=function(){const result=previousRender();patchPaymentDates();removeDuplicateMobileClose();return result};
  let tableTimer,modalTimer;
  new MutationObserver(()=>{if(page!=='dues')return;clearTimeout(tableTimer);tableTimer=setTimeout(patchPaymentDates,20)}).observe($('#content'),{childList:true,subtree:true});
  new MutationObserver(()=>{clearTimeout(modalTimer);modalTimer=setTimeout(removeDuplicateMobileClose,0)}).observe($('#modalRoot'),{childList:true,subtree:true});
  const style=document.createElement('style');
  style.textContent=`.payment-date-inline{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:5px;padding-top:4px;border-top:1px solid #e0e9e6;line-height:1}.payment-date-inline small{width:100%;font-size:8px;color:#71837f;font-weight:700}.payment-date-inline span{display:inline-flex;align-items:center;gap:3px;font-size:9px;font-weight:750;color:#2c6558;white-space:nowrap}.payment-date-inline i{display:grid;place-items:center;width:14px;height:14px;border-radius:50%;background:#e6f4ef;color:#27705e;font-size:7px;font-style:normal;font-weight:900}.payment-date-inline span+span{color:#276578}.payment-date-inline span+span i{background:#e8f3f7;color:#276578}@media(max-width:760px){#rows th:nth-child(3),#rows td:nth-child(3){min-width:112px!important;width:112px!important}.payment-date-inline{gap:3px;margin-top:4px;padding-top:3px}.payment-date-inline small{font-size:7.5px}.payment-date-inline span{font-size:8.5px}.reminder-modal .modal-head>div{max-width:100%!important}}`;
  document.head.appendChild(style);
  patchPaymentDates();removeDuplicateMobileClose();
})();
