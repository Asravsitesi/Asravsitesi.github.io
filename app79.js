(()=>{
  const labels={admin:'Admin',manager:'Yönetici',owner:'Ev Sahibi',tenant:'Kiracı',resident:'Atama Bekliyor'};
  const roleList=p=>{
    const raw=Array.isArray(p?.roles)&&p.roles.length?p.roles:[p?.role||p?.resident_role||'resident'];
    return [...new Set(raw)].filter(x=>labels[x]);
  };
  const roleText=p=>roleList(p).map(x=>labels[x]).join(' · ');
  const badgeHtml=p=>'<div class="visible-role-list">'+roleList(p).map(x=>'<span class="visible-role-badge '+x+'">'+labels[x]+'</span>').join('')+'</div>';

  function patchResidentRoleVisibility(){
    if(page!=='residentContacts')return;
    document.querySelectorAll('.resident-role-table tbody tr').forEach(row=>{
      const cell=row.children[6];if(!cell||cell.querySelector('.final-multi-role-box')||cell.querySelector('.multi-role-box'))return;
      const email=(row.children[2]?.textContent||'').trim().toLocaleLowerCase('tr-TR');
      const name=(row.children[1]?.textContent||'').trim();
      const p=(data.profiles||[]).find(x=>(x.email||'').trim().toLocaleLowerCase('tr-TR')===email&&email!=='—');
      const manual=!p&&(data.residentContacts||[]).find(x=>(x.email||'').trim().toLocaleLowerCase('tr-TR')===email&&email!=='—'||((x.full_name||'').trim()===name&&String(x.unit_id)===String((row.children[0]?.textContent||'').replace(/\D/g,''))));
      const record=p||manual;if(!record)return;
      const html=badgeHtml(record);if(cell.innerHTML!==html)cell.innerHTML=html;
    });
  }

  function patchCurrentUserRole(){
    if(!profile)return;
    const box=document.getElementById('userRole');
    const text=roleText(profile)+' · '+unit(profile.unit_id);
    if(box&&box.textContent!==text)box.textContent=text;
  }

  function patchSettingsRole(){
    if(page!=='settings'||!profile)return;
    const line=[...document.querySelectorAll('#content p')].find(x=>/^Rol:/i.test((x.textContent||'').trim()));
    if(!line)return;
    const html='<b>Roller:</b> '+esc(roleText(profile));if(line.innerHTML!==html)line.innerHTML=html;
  }

  function patchIdeaRoles(){
    if(page!=='ideas')return;
    const cards=[...document.querySelectorAll('#content .idea-card')];
    cards.forEach((card,index)=>{
      const idea=(data.ideas||[])[index],person=(data.profiles||[]).find(x=>x.id===idea?.created_by);if(!person)return;
      const line=[...card.querySelectorAll('.idea-person span')].find(x=>/^Rol:/i.test((x.textContent||'').trim()));
      if(!line)return;
      const html='<b>Roller:</b> '+esc(roleText(person));if(line.innerHTML!==html)line.innerHTML=html;
    });
  }

  function patch(){patchResidentRoleVisibility();patchCurrentUserRole();patchSettingsRole();patchIdeaRoles()}
  const previousRender=render;render=function(){const result=previousRender();patch();requestAnimationFrame(patch);return result};
  const previousLoadAll=loadAll;loadAll=async function(){await previousLoadAll();patch()};
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(patch,40)}).observe(document.getElementById('content'),{childList:true,subtree:true});

  const style=document.createElement('style');style.textContent=`
    .visible-role-list{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px!important;min-width:190px!important}
    .visible-role-badge{display:inline-flex!important;align-items:center!important;padding:5px 8px!important;border:1px solid #c8d9d5!important;border-radius:8px!important;background:#f7fbfa!important;color:#285d52!important;font-size:10px!important;font-weight:800!important;white-space:nowrap!important}
    .visible-role-badge.admin{border-color:#e8b6ad!important;background:#fff4f2!important;color:#8c4035!important}
    .visible-role-badge.manager{border-color:#acd3df!important;background:#eff9fc!important;color:#17657b!important}
    .visible-role-badge.owner{border-color:#acd8c8!important;background:#effaf5!important;color:#246b53!important}
    .visible-role-badge.tenant{border-color:#c9d9d5!important;background:#f4f8f7!important}.visible-role-badge.resident{color:#64736f!important}
    @media(max-width:760px){.visible-role-list{min-width:180px!important}.visible-role-badge{padding:4px 6px!important;font-size:9px!important}}
  `;document.head.appendChild(style);patch();
})();
