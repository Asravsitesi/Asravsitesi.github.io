(()=>{
  const currentPaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');
  const shortDate=value=>value?new Date(value).toLocaleDateString('tr-TR'):'—';
  const fullDate=value=>value?new Date(value).toLocaleString('tr-TR'):'—';

  function removeOldPaymentDisplays(table){
    table.querySelectorAll('.payment-date-header').forEach(x=>x.remove());
    table.querySelectorAll('.payment-date-cell').forEach(x=>x.remove());
    table.querySelectorAll('.payment-date-inline,.payment-date-compact').forEach(x=>x.remove());
    table.querySelectorAll('.missing-due-row td[data-payment-date-span]').forEach(x=>{
      x.colSpan=Math.max(1,Number(x.colSpan||6)-1);
      delete x.dataset.paymentDateSpan;
    });
  }

  function patchPaymentDate(){
    if(page!=='dues')return;
    const table=$('#rows');if(!table)return;
    removeOldPaymentDisplays(table);
    const headers=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
    const dueDateIndex=headers.indexOf('Son ödeme');if(dueDateIndex<0)return;
    [...table.querySelectorAll('tbody tr')].forEach((tr,rowIndex)=>{
      if(tr.classList.contains('missing-due-row'))return;
      const d=tr.dataset.dueId?(data.dues||[]).find(x=>String(x.id)===String(tr.dataset.dueId)):(data.dues||[])[rowIndex];
      const cell=tr.children[dueDateIndex];if(!d||!cell)return;
      if(currentPaid(d)&&d.paid_at){
        cell.insertAdjacentHTML('beforeend','<small class="current-payment-date" title="'+esc(fullDate(d.paid_at))+'">Ödeme: <b>'+esc(shortDate(d.paid_at))+'</b></small>');
      }
    });
  }

  function removeDuplicateMobileClose(){if(innerWidth<=760)$('#modalRoot .reminder-modal .modal-head .close')?.remove()}

  const previousRender=render;
  render=function(){const result=previousRender();patchPaymentDate();removeDuplicateMobileClose();return result};
  let tableTimer,modalTimer;
  new MutationObserver(()=>{if(page!=='dues')return;clearTimeout(tableTimer);tableTimer=setTimeout(patchPaymentDate,15)}).observe($('#content'),{childList:true,subtree:true});
  new MutationObserver(()=>{clearTimeout(modalTimer);modalTimer=setTimeout(removeDuplicateMobileClose,0)}).observe($('#modalRoot'),{childList:true,subtree:true});

  const style=document.createElement('style');
  style.textContent=`
    .payment-date-header,.payment-date-cell{display:none!important}
    .current-payment-date{display:block!important;margin:3px 0 0!important;padding:0!important;border:0!important;background:transparent!important;color:#607a74!important;font-size:9px!important;line-height:1.25!important;white-space:nowrap!important;width:auto!important;min-width:0!important;max-width:max-content!important}
    .current-payment-date b{color:#226b57!important;font-size:9px!important}
    @media(max-width:760px){#rows th:nth-child(3),#rows td:nth-child(3){min-width:96px!important;width:96px!important;max-width:110px!important}.current-payment-date,.current-payment-date b{font-size:8px!important}.reminder-modal .modal-head>div{max-width:100%!important}}
  `;
  document.head.appendChild(style);
  patchPaymentDate();removeDuplicateMobileClose();
})();
