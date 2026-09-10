(()=>{
  let cleaning=false,timer;
  function restoreDuesTable(){
    if(page!=='dues'||cleaning)return;
    const table=$('#rows');if(!table)return;
    cleaning=true;
    try{
      table.querySelectorAll('.payment-date-header,.payment-date-cell,.payment-date-inline,.payment-date-compact,.current-payment-date,.compact-payment-date-header,.compact-payment-date-cell').forEach(x=>x.remove());
      table.querySelectorAll('.missing-due-row td[data-payment-date-span],.missing-due-row td[data-compact-payment-span]').forEach(x=>{
        x.colSpan=Math.max(1,Number(x.colSpan||6)-1);
        delete x.dataset.paymentDateSpan;
        delete x.dataset.compactPaymentSpan;
      });
      table.querySelectorAll('td').forEach(x=>{
        x.style.removeProperty('height');
        x.style.removeProperty('min-height');
        x.style.removeProperty('width');
        x.style.removeProperty('min-width');
        x.style.removeProperty('max-width');
      });
    }finally{cleaning=false}
  }
  function schedule(){
    if(page!=='dues')return;
    restoreDuesTable();
    clearTimeout(timer);
    timer=setTimeout(restoreDuesTable,80);
  }
  const previousRender=render;
  render=function(){const result=previousRender();schedule();return result};
  new MutationObserver(()=>{
    if(page!=='dues'||cleaning)return;
    if($('#rows .payment-date-header,#rows .payment-date-cell,#rows .payment-date-inline,#rows .payment-date-compact,#rows .current-payment-date,#rows .compact-payment-date-header,#rows .compact-payment-date-cell'))schedule();
  }).observe($('#content'),{childList:true,subtree:true});
  const style=document.createElement('style');
  style.textContent='.payment-date-header,.payment-date-cell,.payment-date-inline,.payment-date-compact,.current-payment-date,.compact-payment-date-header,.compact-payment-date-cell{display:none!important}#rows td{height:auto!important;min-height:0!important}';
  document.head.appendChild(style);
  schedule();
})();
