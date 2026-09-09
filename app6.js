(()=>{
  const style=document.createElement('style');
  style.id='final-due-layout-fix';
  style.textContent=`
    html body #app #content .table-wrap{overflow-x:auto!important;overflow-y:visible!important}
    html body #app #content table#rows{width:100%!important;min-width:1240px!important;table-layout:auto!important}
    html body #app #content table#rows th:nth-child(7),
    html body #app #content table#rows td:nth-child(7){width:210px!important;min-width:210px!important;max-width:210px!important;padding-left:10px!important;padding-right:10px!important;overflow:hidden!important;white-space:nowrap!important;position:relative!important}
    html body #app #content table#rows th:nth-child(8),
    html body #app #content table#rows td:nth-child(8){width:350px!important;min-width:350px!important;padding-left:10px!important;padding-right:10px!important;white-space:nowrap!important}
    html body #app #content table#rows tr[data-final-status] td:nth-child(7)>*{display:none!important;visibility:hidden!important}
    html body #app #content table#rows tr[data-final-status] td:nth-child(7)::after{position:static!important;inset:auto!important;float:none!important;display:inline-flex!important;max-width:100%!important;box-sizing:border-box!important;margin:0!important;transform:none!important;vertical-align:middle!important;overflow:hidden!important;text-overflow:ellipsis!important}
    html body #app #content table#rows td:nth-child(8) .doc-actions{display:flex!important;align-items:center!important;gap:7px!important;flex-wrap:nowrap!important;min-width:max-content!important}
    html body #app #content table#rows td:nth-child(8) button{position:relative!important;z-index:1!important;flex:0 0 auto!important}
    @media(max-width:760px){html body #app #content table#rows{min-width:1180px!important}}
  `;
  document.head.appendChild(style);
})();
