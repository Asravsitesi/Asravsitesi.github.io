(()=>{
  function applyLayout(){
    const content=document.getElementById('content');
    if(!content)return;
    content.classList.toggle('budget-page-green',page==='budgets');
    content.classList.toggle('dues-table-compact-actions',page==='dues');
  }
  const previousRender=render;
  render=function(){const result=previousRender();applyLayout();return result;};
  const style=document.createElement('style');
  style.textContent=`
    .budget-page-green .budget-row .progress span{background:linear-gradient(90deg,#2d8a5c,#3b9a6b)!important}
    @media(min-width:761px){
      html body #app #content.dues-table-compact-actions table#rows{width:max-content!important;min-width:1180px!important;table-layout:auto!important}
      html body #app #content.dues-table-compact-actions table#rows th:nth-child(7),html body #app #content.dues-table-compact-actions table#rows td:nth-child(7){width:165px!important;min-width:165px!important;max-width:165px!important;padding-left:10px!important;padding-right:8px!important}
      html body #app #content.dues-table-compact-actions table#rows th:nth-child(8),html body #app #content.dues-table-compact-actions table#rows td:nth-child(8){width:430px!important;min-width:430px!important;max-width:none!important;padding-left:8px!important;padding-right:10px!important}
      #content.dues-table-compact-actions #rows td:nth-child(8) .doc-actions{gap:7px!important;justify-content:flex-start!important}
      #content.dues-table-compact-actions #rows td:nth-child(8) button{padding-left:10px!important;padding-right:10px!important}
    }
  `;
  document.head.appendChild(style);
  applyLayout();
})();
