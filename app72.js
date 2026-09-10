(()=>{
  const iconRules=[
    [/^Excel İndir$/i,'▦'],[/^PDF İndir$/i,'▤'],[/^Excel Şablonu$/i,'▦'],[/^Excel Yükle$/i,'↑'],[/^PDF \/ Dekont Yükle$/i,'↑'],
    [/^Kaydet$/i,'✓'],[/kaydet/i,'✓'],[/^Paylaş$/i,'↗'],[/^Kapat$/i,'×'],[/^Vazgeç$/i,'←'],[/^Tamam$/i,'✓'],
    [/^Filtrele$/i,'⌕'],[/temizle/i,'↺'],[/düzenle/i,'✎'],[/^Sil$/i,'⌫'],[/sil$/i,'⌫'],[/ödeme geçmişi/i,'◷'],
    [/aidat ekle/i,'＋'],[/kalem ekle/i,'＋'],[/duyuru/i,'＋'],[/belge yükle/i,'↑'],[/yenile/i,'↻'],[/indir/i,'⇩'],[/geri|önceki/i,'←'],[/sonraki/i,'→']
  ];

  function removeRedundantClose(){
    $('#mobileDrawerClose')?.remove();
    if(innerWidth>760)return;
    $$('#modalRoot .modal').forEach(modal=>{
      const footerText=(modal.querySelector('.modal-foot')?.textContent||'').toLocaleLowerCase('tr-TR');
      if(/kapat|tamam|çık/.test(footerText))modal.querySelector('.modal-head .close')?.remove();
    });
  }

  function modernizeButtons(root=document){
    root.querySelectorAll('button').forEach(button=>{
      if(button.matches('.mobilebar,.unified-alert-button,.message-alert-v2-button,.mobile-app-nav button,.nav button,.reminder-channel,.sidebar-close-modern'))return;
      button.classList.add('modern-action-button');
      if(button.dataset.modernIcon)return;
      const text=(button.textContent||'').trim();
      const found=iconRules.find(([rule])=>rule.test(text));
      if(found)button.dataset.modernIcon=found[1];
    });
  }

  function enhanceDashboardBudget(){
    if(page!=='dashboard')return;
    const panel=$$('#content .panel').find(x=>x.querySelector('.panel-head h3')?.textContent.trim()==='Bütçe');
    if(!panel)return;
    panel.querySelectorAll('.budget-row').forEach((row,index)=>{
      const item=(data.budgets||[])[index],target=row.querySelector('.budget-top>div:last-child');
      if(!item||!target||target.querySelector('.budget-amounts-modern'))return;
      target.innerHTML='<div class="budget-amounts-modern"><span><small>Harcanan</small><b>'+money(item.spent)+'</b></span><i>/</i><span><small>Planlanan</small><b>'+money(item.planned)+'</b></span></div>';
    });
  }

  function enhance(){removeRedundantClose();modernizeButtons();enhanceDashboardBudget();}
  const previousRender=render;
  render=function(){const result=previousRender();requestAnimationFrame(enhance);return result;};
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(enhance,20);}).observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',()=>setTimeout(enhance,30),{passive:true});

  const style=document.createElement('style');
  style.textContent=`
    #mobileDrawerClose{display:none!important}
    button.modern-action-button{--btn-bg:#fff;--btn-color:#24484e;--btn-border:#cbdad8;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-height:42px;border:1px solid var(--btn-border)!important;border-radius:12px!important;padding:9px 14px!important;background:var(--btn-bg)!important;color:var(--btn-color)!important;font-size:12.5px!important;font-weight:800!important;letter-spacing:.005em!important;box-shadow:0 3px 10px rgba(23,59,63,.07),inset 0 1px 0 rgba(255,255,255,.7)!important;transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease!important;text-decoration:none!important}
    button.modern-action-button[data-modern-icon]::before{content:attr(data-modern-icon);display:inline-grid;place-items:center;min-width:18px;height:18px;font-size:15px;line-height:1;font-weight:900}
    button.primary.modern-action-button{--btn-bg:linear-gradient(135deg,#087f84 0%,#075f69 100%);--btn-color:#fff;--btn-border:#075c64;box-shadow:0 5px 14px rgba(7,105,111,.22),inset 0 1px 0 rgba(255,255,255,.2)!important}
    button.ghost.modern-action-button{--btn-bg:linear-gradient(180deg,#fff 0%,#f4f8f7 100%);--btn-color:#28535a;--btn-border:#c7d8d5}
    button.danger.modern-action-button{--btn-bg:linear-gradient(180deg,#fff7f6 0%,#fdebea 100%);--btn-color:#b63d36;--btn-border:#efc2be}
    button.modern-action-button:hover:not(:disabled){transform:translateY(-1px)!important;box-shadow:0 7px 18px rgba(23,59,63,.14),inset 0 1px 0 rgba(255,255,255,.75)!important;filter:saturate(1.06)}
    button.modern-action-button:active:not(:disabled){transform:translateY(0) scale(.98)!important;box-shadow:0 2px 7px rgba(23,59,63,.1)!important}
    button.modern-action-button:focus-visible{outline:3px solid rgba(15,143,148,.22)!important;outline-offset:2px!important}
    button.modern-action-button:disabled{opacity:.52!important;cursor:not-allowed!important;box-shadow:none!important}
    .dues-io-actions{gap:9px!important}.dues-io-actions button{min-height:40px!important}
    .modal-foot{gap:10px!important}.modal-foot button.modern-action-button{min-width:105px}
    .doc-actions{gap:7px!important}.doc-actions button.modern-action-button{padding:7px 10px!important;min-height:34px!important;border-radius:10px!important;font-size:11px!important}
    .budget-amounts-modern{display:flex;align-items:flex-end;justify-content:flex-end;gap:8px;text-align:right}
    .budget-amounts-modern span{display:grid;gap:1px}.budget-amounts-modern small{font-size:9px!important;line-height:1.1;color:#6b7f7c!important;font-weight:750!important;text-transform:uppercase;letter-spacing:.04em}.budget-amounts-modern b{font-size:12px;color:#204b51}.budget-amounts-modern i{font-style:normal;color:#9aacaa;padding-bottom:1px}
    @media(max-width:760px){
      #mobileDrawerClose{display:none!important}
      button.modern-action-button{min-height:46px!important;border-radius:13px!important;font-size:13px!important;padding:10px 14px!important}
      .modal-head .close{display:none!important}.modal-foot button.modern-action-button{width:100%!important;min-width:0!important}
      .file-delivery-actions{display:grid!important;grid-template-columns:1fr!important}
      .dues-io-actions button{min-height:46px!important}.doc-actions button.modern-action-button{min-height:42px!important}
      .budget-top{align-items:flex-start!important;gap:10px!important}.budget-amounts-modern{gap:6px!important;flex-wrap:wrap}.budget-amounts-modern small{font-size:8px!important}.budget-amounts-modern b{font-size:11px!important}
    }
  `;
  document.head.appendChild(style);
  enhance();
})();
