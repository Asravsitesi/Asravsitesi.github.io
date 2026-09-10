(()=>{
  const host=document.getElementById('siteChatbot');if(!host)return;
  const input=host.querySelector('#asravChatInput'),button=host.querySelector('#asravChatSend'),messages=host.querySelector('.asrav-chat-messages'),localSend=button?.onclick;
  if(!input||!button||!messages||!localSend)return;
  const history=[];let provider='auto';let testerReady=false;
  const labels={auto:'Otomatik',groq:'Groq',openrouter:'OpenRouter'};
  const add=(text,type)=>{const e=document.createElement('div');e.className='asrav-chat-message '+type;e.textContent=text;messages.appendChild(e);messages.scrollTop=messages.scrollHeight;return e};
  async function enableTester(){
    try{
      if(testerReady||host.querySelector('.asrav-ai-testbar'))return;
      if(typeof db==='undefined')return;
      const {data:{user}}=await db.auth.getUser();if(!user)return;
      const {data:p}=await db.from('profiles').select('role,roles').eq('id',user.id).single();
      const roles=Array.isArray(p?.roles)?p.roles:[];
      if(p?.role!=='admin'&&!roles.includes('admin'))return;
      const bar=document.createElement('div');bar.className='asrav-ai-testbar';
      bar.innerHTML='<label>Model testi</label><select aria-label="Test edilecek yapay zekâ modeli"><option value="auto">Otomatik geçiş</option><option value="groq">Groq (ana)</option><option value="openrouter">OpenRouter (yedek)</option></select><span>Yönetici</span>';
      host.querySelector('.asrav-chat-suggestions')?.before(bar);
      bar.querySelector('select').onchange=e=>{provider=e.target.value;add(labels[provider]+' test modu seçildi.','system')};
      testerReady=true;
    }catch(e){console.warn('Model test seçicisi açılamadı.')}
  }
  async function aiSend(){
    const text=input.value.trim();if(!text)return;input.value='';
    const userNode=add(text,'user'),waiting=add((provider==='auto'?'Yapay zekâ':labels[provider])+' yanıtı hazırlanıyor…','bot');button.disabled=true;
    try{
      const result=await db.functions.invoke('asrav-ai-assistant',{body:{message:text,history:history.slice(-6),provider}}),d=result.data;
      if(d?.test&&d.success===false){waiting.className='asrav-chat-message error';waiting.textContent=labels[d.provider||provider]+' başarısız: '+(d.diagnostic||d.error||'yanıt alınamadı');return}
      if(!result.error&&d?.answer){waiting.textContent=d.answer;const badge=document.createElement('small');badge.className='asrav-ai-provider';badge.textContent='Yanıt: '+labels[d.provider||provider];waiting.appendChild(badge);history.push({role:'user',content:text},{role:'assistant',content:d.answer});return}
    }catch(e){console.warn('AI sağlayıcısı kullanılamadı.')}
    if(provider!=='auto'){waiting.className='asrav-chat-message error';waiting.textContent=labels[provider]+' testinde bağlantı hatası oluştu.';return}
    userNode.remove();waiting.remove();input.value=text;localSend.call(button);const note=document.createElement('small');note.className='asrav-chat-fallback-note';note.textContent='AI servisleri kullanılamadığı için yerel güvenli yanıt gösterildi.';messages.appendChild(note);messages.scrollTop=messages.scrollHeight;
  }
  button.onclick=async()=>{try{await aiSend()}finally{button.disabled=false}};
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();button.click()}};
  host.querySelectorAll('.asrav-chat-suggestions button').forEach(b=>b.onclick=()=>{input.value=b.textContent;button.click()});
  const style=document.createElement('style');style.textContent='.asrav-ai-testbar{display:flex;align-items:center;gap:6px;padding:7px 10px;border-top:1px solid #dce7e5;background:#f5faf9;font-size:11px}.asrav-ai-testbar label{font-weight:700;color:#28535a}.asrav-ai-testbar select{min-width:0;flex:1;border:1px solid #bfd3cf;border-radius:7px;padding:5px;background:#fff;color:#17383d}.asrav-ai-testbar span,.asrav-ai-provider{color:#64817c;font-size:9px}.asrav-ai-provider{display:block;margin-top:6px;font-weight:700}.asrav-chat-message.system{align-self:center;background:#eef6f5;color:#426862;font-size:10px}.asrav-chat-message.error{background:#fff0f0;color:#9a3030;white-space:pre-wrap}.asrav-chat-fallback-note{display:block;margin:-5px 0 10px;padding:0 12px;color:#6c7d79;font-size:10px}.asrav-chat-message.bot{white-space:pre-wrap}';document.head.appendChild(style);
  enableTester();
  if(typeof db!=='undefined')db.auth.onAuthStateChange(()=>setTimeout(enableTester,30));else{let tries=0;const t=setInterval(()=>{tries++;if(typeof db!=='undefined'){clearInterval(t);db.auth.onAuthStateChange(()=>setTimeout(enableTester,30));enableTester()}if(tries>40)clearInterval(t)},500)}
})();
