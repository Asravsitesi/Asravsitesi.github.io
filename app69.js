(()=>{
  const isPaid=d=>d?.current_due_paid===true||(d?.current_due_paid==null&&d?.status==='paid');
  const paymentDate=d=>isPaid(d)&&d?.paid_at?new Date(d.paid_at).toLocaleDateString('tr-TR'):'—';
  let patching=false,timer;

  function patchCompactPaymentColumn(){
    if(page!=='dues'||patching)return;
    const table=$('#rows'),headRow=table?.querySelector('thead tr');
    if(!table||!headRow)return;
    patching=true;
    try{
      let header=headRow.querySelector('.compact-payment-date-header');
      if(!header){
        const dueHeader=[...headRow.children].find(x=>x.textContent.trim()==='Son ödeme');
        if(!dueHeader)return;
        header=document.createElement('th');
        header.className='compact-payment-date-header';
        header.innerHTML='<span>Ödeme</span><small>tarihi</small>';
        dueHeader.after(header);
      }
      const columnIndex=[...headRow.children].indexOf(header);
      [...table.querySelectorAll('tbody tr')].forEach((tr,rowIndex)=>{
        if(tr.classList.contains('missing-due-row')){
          const merged=tr.querySelector('td[colspan]');
          if(merged&&!merged.dataset.compactPaymentSpan){
            merged.colSpan=Number(merged.colSpan||5)+1;
            merged.dataset.compactPaymentSpan='1';
          }
          return;
        }
        const d=tr.dataset.dueId?(data.dues||[]).find(x=>String(x.id)===String(tr.dataset.dueId)):(data.dues||[])[rowIndex];
        if(!d)return;
        let cell=tr.querySelector('.compact-payment-date-cell');
        if(!cell){
          cell=document.createElement('td');
          cell.className='compact-payment-date-cell';
          const before=tr.children[columnIndex];
          before?tr.insertBefore(cell,before):tr.appendChild(cell);
        }
        const value=paymentDate(d);
        if(cell.textContent!==value)cell.textContent=value;
        cell.classList.toggle('has-payment-date',value!=='—');
        cell.title=value==='—'?'Aidat ödenmedi':'Aidat ödeme tarihi: '+new Date(d.paid_at).toLocaleString('tr-TR');
      });
    }finally{patching=false}
  }

  function schedulePatch(){
    if(page!=='dues')return;
    patchCompactPaymentColumn();
    requestAnimationFrame(patchCompactPaymentColumn);
    clearTimeout(timer);
    timer=setTimeout(patchCompactPaymentColumn,100);
  }

  const previousRender=render;
  render=function(){const result=previousRender();schedulePatch();return result};

  const style=document.createElement('style');
  style.textContent=`
    .compact-payment-date-header,.compact-payment-date-cell{box-sizing:border-box!important;width:78px!important;min-width:78px!important;max-width:78px!important;padding-left:6px!important;padding-right:6px!important;text-align:center!important;white-space:nowrap!important}
    .compact-payment-date-header span,.compact-payment-date-header small{display:block!important;line-height:1.05!important}
    .compact-payment-date-header small{margin-top:2px!important;color:#71817e!important;font-size:8px!important;text-transform:none!important}
    .compact-payment-date-cell{color:#879692!important;font-size:9px!important;font-weight:650!important}
    .compact-payment-date-cell.has-payment-date{color:#286958!important;font-weight:800!important}
    @media(max-width:760px){.compact-payment-date-header,.compact-payment-date-cell{width:72px!important;min-width:72px!important;max-width:72px!important;padding-left:4px!important;padding-right:4px!important;font-size:8.5px!important}.compact-payment-date-header small{font-size:7.5px!important}}
  `;
  document.head.appendChild(style);
  schedulePatch();
})();
