(()=>{
  const style=document.createElement('style');
  style.textContent=`
    #content .permission-card .panel-head button[data-save-role],
    #content .user-action-line button,
    #content .role-multi-save,
    #content .resident-table-btn:not(.danger-lite),
    #modalRoot #saveRoleResident,
    #modalRoot #saveProfileDetails,
    #modalRoot #approveConfirmedAction{
      border:1px solid #237654!important;
      background:#2d8a5c!important;
      color:#fff!important;
      box-shadow:0 5px 14px rgba(35,118,84,.22)!important;
    }
    #content .permission-card .panel-head button[data-save-role]:hover,
    #content .user-action-line button:hover,
    #content .role-multi-save:hover,
    #content .resident-table-btn:not(.danger-lite):hover,
    #modalRoot #saveRoleResident:hover,
    #modalRoot #saveProfileDetails:hover,
    #modalRoot #approveConfirmedAction:hover{
      border-color:#1f6c4c!important;
      background:#237654!important;
      color:#fff!important;
    }
    #content .permission-card .panel-head button[data-save-role]::before,
    #content .user-action-line button::before{
      background:rgba(255,255,255,.16)!important;
      color:#fff!important;
    }
  `;
  document.head.appendChild(style);
})();
