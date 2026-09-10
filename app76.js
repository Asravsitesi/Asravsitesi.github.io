(()=>{
  function markDueModal(){
    const modal=document.querySelector('#modalRoot .modal');
    if(modal?.querySelector('#mUnit'))modal.classList.add('due-entry-modal-fixed');
  }
  const previousRender=render;
  render=function(){const result=previousRender();markDueModal();return result};
  const previousModal=typeof modal==='function'?modal:null;
  if(previousModal)modal=function(type,record=null){const result=previousModal(type,record);if(type==='due')markDueModal();return result};
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(markDueModal,0)}).observe(document.getElementById('modalRoot'),{childList:true,subtree:true});
  const style=document.createElement('style');style.textContent=`
    #modalRoot .modal-backdrop:has(.due-entry-modal-fixed){padding:12px!important;align-items:center!important;overflow:hidden!important}
    #modalRoot .due-entry-modal-fixed{display:flex!important;flex-direction:column!important;width:min(760px,calc(100vw - 24px))!important;max-width:760px!important;height:auto!important;max-height:calc(100dvh - 24px)!important;overflow:hidden!important}
    #modalRoot .due-entry-modal-fixed .modal-head{flex:0 0 auto!important;padding:15px 20px!important}
    #modalRoot .due-entry-modal-fixed .modal-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;padding:15px 20px!important}
    #modalRoot .due-entry-modal-fixed .modal-foot{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;z-index:5!important;display:flex!important;flex:0 0 auto!important;margin:0!important;padding:12px 20px max(12px,env(safe-area-inset-bottom))!important;border-top:1px solid #dce7e3!important;background:#fff!important;box-shadow:0 -7px 18px rgba(20,65,55,.08)!important}
    #modalRoot .due-entry-modal-fixed .form-grid{gap:10px 18px!important}
    #modalRoot .due-entry-modal-fixed .field{margin-bottom:4px!important}
    #modalRoot .due-entry-modal-fixed .partial-debt-grid{gap:8px!important;margin-top:9px!important}
    #modalRoot .due-entry-modal-fixed .partial-help{margin-top:4px!important}
    #approveConfirmedAction,#saveRoleResident,#saveProfileDetails,#content .role-multi-save,#content .resident-table-btn:not(.danger-lite),#content .user-action-line button{border-color:#237654!important;background:linear-gradient(135deg,#329468,#237654)!important;color:#fff!important;box-shadow:0 5px 13px rgba(35,118,84,.22)!important}
    #approveConfirmedAction:hover,#saveRoleResident:hover,#saveProfileDetails:hover,#content .role-multi-save:hover,#content .resident-table-btn:not(.danger-lite):hover,#content .user-action-line button:hover{background:linear-gradient(135deg,#3ba477,#286f55)!important}
    .action-confirm-icon{background:#e5f5ed!important;color:#237654!important}
    @media(max-width:760px){
      #modalRoot .modal-backdrop:has(.due-entry-modal-fixed){align-items:flex-end!important;padding:0!important}
      #modalRoot .due-entry-modal-fixed{width:100%!important;max-width:none!important;max-height:96dvh!important;border-radius:18px 18px 0 0!important}
      #modalRoot .due-entry-modal-fixed .modal-head{padding:13px 15px!important}
      #modalRoot .due-entry-modal-fixed .modal-body{padding:12px 15px!important}
      #modalRoot .due-entry-modal-fixed .modal-foot{padding:10px 15px max(10px,env(safe-area-inset-bottom))!important;gap:8px!important}
      #modalRoot .due-entry-modal-fixed .modal-foot button{flex:1!important;min-height:46px!important}
      #modalRoot .due-entry-modal-fixed .form-grid,#modalRoot .due-entry-modal-fixed .partial-debt-grid{grid-template-columns:1fr!important;gap:7px!important}
    }
  `;document.head.appendChild(style);markDueModal();
})();
