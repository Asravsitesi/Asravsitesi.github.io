(()=>{
  const currentPaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');
  const shortDate=value=>value?new Date(value).toLocaleDateString('tr-TR'):'—';
  const fullDate=value=>value?new Date(value).toLocaleString('tr-TR'):'—';
  let patching=false;

  function restoreTable(){
    const table=$('#rows');if(!table)return;
    table.querySelectorAll('.payment-date-header,.payment-date-cell').forEach(x=>x.remove());
    table.querySelectorAll('.payment-date-inline,.payment-date-compact,.current-payment-date').forEach(x=>x.remove());
    table.querySelectorAll('.missing-due-row td[data-payment-date-span]').forEach(x=>{
      x.colSpan=Math.max(1,Number(x.colSpan||6)-1);
      delete x.dataset.paymentDateSpan;
    });
  }

  function patchPaymentDate(){
    if(page!=='dues'||patching)return;
    const table=$('#rows');if(!table)return;
    patching=true;
    try{
      restoreTable();
      const headers=[...table.querySelectorAll('thead th')].map(x=>x.textContent.trim());
      const dueDateIndex=headers.indexOf('Son ödeme');if(dueDateIndex<0)return;
      [...table.querySelectorAll('tbody tr')].forEach((tr,rowIndex)=>{
        if(tr.classList.contains('missing-due-row'))return;
        const d=tr.dataset.dueId?(data.dues||[]).find(x=>String(x.id)===String(tr.dataset.dueId)):(data.dues||[])[rowIndex];
        const cell=tr.children[dueDateIndex];if(!d||!cell||!currentPaid(d)||!d.paid_at)return;
        const note=document.createElement('small');
        note.className='current-payment-date';
        note.title='Aidat ödeme tarihi: '+fullDate(d.paid_at);
        note.innerHTML='Ödeme: <b>'+esc(shortDate(d.paid_at))+'</b>';
        cell.appendChild(note);
      });
    }finally{patching=false}
  }

  function schedulePatch(){
    if(page!=='dues')return;
    patchPaymentDate();
    requestAnimationFrame(patchPaymentDate);
    setTimeout(patchPaymentDate,120);
  }
  function removeDuplicateMobileClose(){if(innerWidth<=760)$('#modalRoot .reminder-modal .modal-head .close')?.remove()}

  const previousRender=render;
  render=function(){const result=previousRender();schedulePatch();removeDuplicateMobileClose();return result};
  let modalTimer;
  new MutationObserver(()=>{clearTimeout(modalTimer);modalTimer=setTimeout(removeDuplicateMobileClose,0)}).observe($('#modalRoot'),{childList:true,subtree:true});

  const style=document.createElement('style');
  style.textContent=`
    .payment-date-header,.payment-date-cell{display:none!important}
    #rows td{height:auto!important;min-height:0!important}
    .current-payment-date{display:block!important;width:auto!important;min-width:0!important;max-width:max-content!important;height:auto!important;margin:2px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;color:#687d79!important;font-size:8.5px!important;line-height:1.15!important;white-space:nowrap!important}
    .current-payment-date b{font-size:8.5px!important;color:#315f56!important;background:none!important;padding:0!important}
    @media(max-width:760px){#rows th:nth-child(3),#rows td:nth-child(3){min-width:92px!important;width:92px!important;max-width:104px!important}.current-payment-date,.current-payment-date b{font-size:8px!important}.reminder-modal .modal-head>div{max-width:100%!important}}
  `;
  document.head.appendChild(style);
  schedulePatch();removeDuplicateMobileClose();
})();
