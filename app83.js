(()=>{
  const host=document.getElementById('siteChatbot');if(!host)return;
  const input=host.querySelector('#asravChatInput'),button=host.querySelector('#asravChatSend'),messages=host.querySelector('.asrav-chat-messages'),localSend=button?.onclick,history=[];
  if(!input||!button||!messages||!localSend)return;
  const add=(text,type)=>{const e=document.createElement('div');e.className='asrav-chat-message '+type;e.textContent=text;messages.appendChild(e);messages.scrollTop=messages.scrollHeight;return e};
  async function aiSend(){
    const text=input.value.trim();if(!text)return;input.value='';
    const userNode=add(text,'user'),waiting=add('Yapay zekâ yanıtı hazırlanıyor…','bot');button.disabled=true;
    try{
      const result=await db.functions.invoke('asrav-ai-assistant',{body:{message:text,history:history.slice(-6)}});
      if(!result.error&&result.data?.answer){waiting.textContent=result.data.answer;history.push({role:'user',content:text},{role:'assistant',content:result.data.answer});return;}
    }catch(e){console.warn('AI sağlayıcıları kullanılamadı; yerel yanıta geçiliyor.');}
    userNode.remove();waiting.remove();input.value=text;localSend.call(button);
    const note=document.createElement('small');note.className='asrav-chat-fallback-note';note.textContent='Ücretsiz AI kotası kullanılamadığı için yerel güvenli yanıt gösterildi.';messages.appendChild(note);messages.scrollTop=messages.scrollHeight;
    button.disabled=false;
  }
  button.onclick=async()=>{try{await aiSend()}finally{button.disabled=false}};
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();button.click()}};
  host.querySelectorAll('.asrav-chat-suggestions button').forEach(b=>b.onclick=()=>{input.value=b.textContent;button.click()});
  const style=document.createElement('style');style.textContent='.asrav-chat-fallback-note{display:block;margin:-5px 0 10px;padding:0 12px;color:#6c7d79;font-size:10px}.asrav-chat-message.bot{white-space:pre-wrap}';document.head.appendChild(style);
})();
