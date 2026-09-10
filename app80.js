(()=>{
  const isPhone=()=>matchMedia('(max-width:760px)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const duePaid=d=>d&&((d.current_due_paid===true)||(d.current_due_paid==null&&d.status==='paid'));
  const gross=d=>Math.max(0,Number(d?.previous_debt)||0);
  const paidOld=d=>Math.max(0,Math.min(gross(d),Number(d?.previous_debt_paid_amount!=null?d.previous_debt_paid_amount:(d?.previous_debt_paid?gross(d):0))||0));
  const oldStatus=d=>gross(d)<=0?'Borç yok':((d.previous_debt_paid===true||paidOld(d)>=gross(d))?'Ödendi':(paidOld(d)>0?'Kısmi ödeme':'Ödenmedi'));
  const trDate=v=>v?new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  const remaining=d=>(duePaid(d)?0:Number(d.amount)||0)+Math.max(0,gross(d)-paidOld(d));

  function visibleDues(){
    const trs=[...document.querySelectorAll('#rows tbody tr:not(.missing-due-row)')],ids=new Set(trs.filter(x=>!x.hidden&&x.dataset.dueId).map(x=>String(x.dataset.dueId)));
    return ids.size?(data.dues||[]).filter(d=>ids.has(String(d.id))):(data.dues||[]);
  }
  function rows(){return visibleDues().map(d=>{const p=occupant(d.unit_id),g=gross(d),po=paidOld(d),left=remaining(d);return{'Villa':unit(d.unit_id),'Sakin':p.full_name||'','Dönem':String(d.period||'').slice(0,7),'Son Ödeme':d.due_date||'','Aidat':Number(d.amount)||0,'Aidat Durumu':duePaid(d)?'Ödendi':'Ödenmedi','Aidat Ödeme Tarihi':duePaid(d)?trDate(d.paid_at):'','Geçmiş Borç':g,'Geçmiş Borç Durumu':oldStatus(d),'Geçmiş Borç Ödeme Tarihi':oldStatus(d)==='Ödendi'?trDate(d.previous_debt_paid_at):'','Geçmiş Borca Ödenen':po,'Kalan Geçmiş Borç':Math.max(0,g-po),'Toplam Kalan Borç':left,'Durum':left<=0?'Ödendi':(duePaid(d)||po>0?'Kısmi ödeme':'Ödenmedi')};});}

  function saveFallback(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);}

  async function openExcelOnPhone(){
    const list=rows();if(!list.length)return toast('Dışa aktarılacak aidat bulunamadı.','error');
    try{
      const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(list);ws['!cols']=[{wch:12},{wch:24},{wch:11},{wch:13},{wch:12},{wch:16},{wch:22},{wch:14},{wch:22},{wch:26},{wch:22},{wch:20},{wch:20},{wch:16}];XLSX.utils.book_append_sheet(wb,ws,'Aidatlar ve Ödemeler');
      const bytes=XLSX.write(wb,{bookType:'xlsx',type:'array'}),name='Asrav_Sitesi_Aidatlar_Odemeler_'+new Date().toISOString().slice(0,10)+'.xlsx',blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),file=new File([blob],name,{type:blob.type});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        try{await navigator.share({files:[file],title:'Excel ile aç'});return}catch(e){if(e.name==='AbortError')return;}
      }
      saveFallback(blob,name);toast('Excel dosyası indirildi. Telefonunuz dosyayı uygun Excel uygulamasıyla açacaktır.');
    }catch(e){console.error(e);toast('Excel dosyası hazırlanamadı. Lütfen tekrar deneyin.','error');}
  }

  async function openPdfOnPhone(){
    const list=rows();if(!list.length)return toast('Dışa aktarılacak aidat bulunamadı.','error');
    if(!window.jspdf?.jsPDF||!window.html2canvas)return toast('PDF bileşeni yüklenemedi.','error');
    const preview=window.open('about:blank','_blank');
    if(preview){preview.document.title='PDF hazırlanıyor';preview.document.body.innerHTML='<p style="font:16px system-ui;padding:24px">PDF hazırlanıyor…</p>';}
    const cols=['Villa','Sakin','Dönem','Son Ödeme','Aidat','Aidat Durumu','Aidat Ödeme Tarihi','Geçmiş Borç','Geçmiş Borç Durumu','Geçmiş Borç Ödeme Tarihi','Geçmiş Borca Ödenen','Kalan Geçmiş Borç','Toplam Kalan Borç','Durum'],moneyCols=new Set(['Aidat','Geçmiş Borç','Geçmiş Borca Ödenen','Kalan Geçmiş Borç','Toplam Kalan Borç']),host=document.createElement('div');host.className='pdf-tr';host.innerHTML='<h1>Asrav Sitesi — Aidat ve Ödeme Listesi</h1><p>Oluşturma: '+esc(new Date().toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}))+'</p><table><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+list.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(moneyCols.has(c)?money(r[c]):(r[c]||'—'))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';document.body.appendChild(host);
    try{
      if(document.fonts?.ready)await document.fonts.ready;const canvas=await html2canvas(host,{scale:1.5,backgroundColor:'#fff',useCORS:true,logging:false}),doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a3'}),ratio=Math.min(400/canvas.width,277/canvas.height);doc.addImage(canvas.toDataURL('image/png'),'PNG',10,10,canvas.width*ratio,canvas.height*ratio,'FAST');
      const blob=doc.output('blob'),url=URL.createObjectURL(blob),name='Asrav_Sitesi_Aidatlar_Odemeler_'+new Date().toISOString().slice(0,10)+'.pdf';
      if(preview&&!preview.closed){preview.location.replace(url);setTimeout(()=>URL.revokeObjectURL(url),300000);}else{const file=new File([blob],name,{type:'application/pdf'});if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'PDF ile aç'});else saveFallback(blob,name);}
    }catch(e){console.error(e);if(preview&&!preview.closed)preview.close();toast('PDF hazırlanamadı. Lütfen tekrar deneyin.','error');}finally{host.remove();}
  }

  function bind(){if(page!=='dues'||!isPhone())return;const excel=document.getElementById('exportDuesExcel'),pdf=document.getElementById('exportDuesPdf');if(excel)excel.onclick=openExcelOnPhone;if(pdf)pdf.onclick=openPdfOnPhone;}
  const previousRender=render;render=function(){const result=previousRender();bind();setTimeout(bind,80);return result};
  let timer;new MutationObserver(()=>{if(page!=='dues'||!isPhone())return;clearTimeout(timer);timer=setTimeout(bind,90)}).observe(document.getElementById('content'),{childList:true,subtree:true});
  addEventListener('resize',()=>setTimeout(bind,80),{passive:true});bind();
})();
