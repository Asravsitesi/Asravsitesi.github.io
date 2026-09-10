(()=>{
  const dueButtons={
    openPaymentHistory:{icon:'◷',label:'Ödeme Geçmişi'},
    importDueExcel:{icon:'↑',label:'Excel Yükle'},
    importDuePdf:{icon:'↑',label:'PDF / Dekont Yükle'},
    exportDuesExcel:{icon:'⇩',label:'Excel İndir'},
    exportDuesPdf:{icon:'⇩',label:'PDF İndir'}
  };

  function fixDashboardBudget(){
    if(page!=='dashboard')return;
    const panel=Array.from(document.querySelectorAll('#content .panel')).find(x=>x.querySelector('.panel-head h3')?.textContent.trim()==='Bütçe');
    if(!panel)return;
    panel.classList.add('dashboard-budget-fixed');
    panel.querySelectorAll('.budget-row').forEach((row,index)=>{
      const item=(data.budgets||[])[index],top=row.querySelector('.budget-top');
      if(!item||!top)return;
      let values=top.querySelector('.dashboard-budget-values');
      if(!values){
        top.querySelector(':scope > span:last-child')?.remove();
        values=document.createElement('div');
        values.className='dashboard-budget-values';
        top.appendChild(values);
      }
      values.innerHTML='<span><small>Harcanan</small><b>'+money(item.spent)+'</b></span><i>/</i><span><small>Planlanan</small><b>'+money(item.planned)+'</b></span>';
    });
  }

  function fixDuesActions(){
    if(page!=='dues')return;
    const group=document.querySelector('.dues-io-actions');if(!group)return;
    group.classList.add('dues-actions-fixed');
    Object.entries(dueButtons).forEach(([id,config])=>{
      const button=document.getElementById(id);if(!button)return;
      button.classList.add('dues-action-modern');
      button.dataset.actionIcon=config.icon;
      if(button.textContent.trim()!==config.label)button.textContent=config.label;
    });
  }

  function apply(){fixDashboardBudget();fixDuesActions();}
  const previousRender=render;
  render=function(){const result=previousRender();apply();requestAnimationFrame(apply);return result;};
  let timer;
  new MutationObserver(()=>{if(page!=='dashboard'&&page!=='dues')return;clearTimeout(timer);timer=setTimeout(apply,30);}).observe(document.getElementById('content'),{childList:true,subtree:true});

  const style=document.createElement('style');
  style.textContent=`
    .dashboard-budget-fixed .progress span{background:linear-gradient(90deg,#2d8a5c,#3b9a6b)!important}
    .dashboard-budget-fixed .budget-top{align-items:flex-end!important;gap:12px!important}
    .dashboard-budget-values{display:flex;align-items:flex-end;justify-content:flex-end;gap:8px;text-align:right;white-space:nowrap}
    .dashboard-budget-values span{display:grid;gap:2px}.dashboard-budget-values small{font-size:9px!important;line-height:1!important;color:#667d78!important;font-weight:800!important;text-transform:uppercase;letter-spacing:.045em}.dashboard-budget-values b{font-size:12px!important;line-height:1.2;color:#1e4d45!important}.dashboard-budget-values i{font-style:normal;color:#9badab;padding-bottom:1px}
    .dues-actions-fixed{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:10px!important}
    .dues-actions-fixed .dues-action-modern{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-height:42px!important;margin:0!important;padding:9px 14px!important;border:1px solid #07646c!important;border-radius:12px!important;background:linear-gradient(135deg,#087f84,#075f69)!important;color:#fff!important;font-size:12px!important;font-weight:850!important;line-height:1.1!important;white-space:nowrap!important;box-shadow:0 5px 14px rgba(7,105,111,.2)!important}
    .dues-actions-fixed .dues-action-modern::before{content:attr(data-action-icon);display:inline-grid;place-items:center;width:19px;height:19px;border-radius:6px;background:rgba(255,255,255,.16);font-size:14px;font-weight:900}
    .dues-actions-fixed .dues-action-modern:hover{transform:translateY(-1px)!important;background:linear-gradient(135deg,#0a9197,#076975)!important;box-shadow:0 8px 18px rgba(7,105,111,.27)!important}
    .dues-actions-fixed .dues-action-modern:active{transform:scale(.98)!important}
    @media(max-width:760px){.dashboard-budget-fixed .budget-top{align-items:flex-start!important}.dashboard-budget-values{gap:6px!important;flex-wrap:wrap!important}.dashboard-budget-values small{font-size:8px!important}.dashboard-budget-values b{font-size:11px!important}.dues-actions-fixed{display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important;gap:8px!important}.dues-actions-fixed .dues-action-modern{width:100%!important;min-width:0!important;min-height:48px!important;padding:10px 8px!important;font-size:11px!important}.dues-actions-fixed #openPaymentHistory{grid-column:1/3!important}}
  `;
  document.head.appendChild(style);
  apply();
})();
