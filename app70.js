(()=>{
  const duePaid=d=>d&&((d.current_due_paid===true)||(d.current_due_paid==null&&d.status==='paid'));
  const oldGross=d=>Math.max(0,Number(d&&d.previous_debt)||0);
  const oldPaidAmount=d=>Math.max(0,Math.min(oldGross(d),Number(d&&d.previous_debt_paid_amount!=null?d.previous_debt_paid_amount:(d&&d.previous_debt_paid?oldGross(d):0))||0));
  const oldPaid=d=>oldGross(d)>0&&(d.previous_debt_paid===true||oldPaidAmount(d)>=oldGross(d));
  const trDate=v=>v?new Date(v).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  const remaining=d=>(duePaid(d)?0:Number(d.amount)||0)+Math.max(0,oldGross(d)-oldPaidAmount(d));

  function selectedDues(){
    const domRows=Array.from(document.querySelectorAll('#rows tbody tr:not(.missing-due-row)'));
    const ids=new Set(domRows.filter(x=>!x.hidden&&x.dataset.dueId).map(x=>String(x.dataset.dueId)));
    return ids.size?(data.dues||[]).filter(d=>ids.has(String(d.id))):(data.dues||[]);
  }

  function exportRows(){
    return selectedDues().map(d=>{
      const person=occupant(d.unit_id),gross=oldGross(d),paidOld=oldPaidAmount(d),left=remaining(d);
      return {
        'Villa':unit(d.unit_id),'Sakin':person.full_name||'','Dönem':String(d.period||'').slice(0,7),'Son Ödeme':d.due_date||'',
        'Aidat':Number(d.amount)||0,'Aidat Ödendi':duePaid(d)?'Evet':'Hayır','Aidat Ödeme Tarihi':duePaid(d)?trDate(d.paid_at):'',
        'Geçmiş Borç':gross,'Geçmiş Borç Ödendi':oldPaid(d)?'Evet':'Hayır','Geçmiş Borç Ödeme Tarihi':oldPaid(d)?trDate(d.previous_debt_paid_at):'',
        'Geçmiş Borca Ödenen':paidOld,'Kalan Geçmiş Borç':Math.max(0,gross-paidOld),'Toplam Kalan Borç':left,
        'Durum':left<=0?'Ödendi':(duePaid(d)||paidOld>0?'Kısmi ödeme':'Ödenmedi')
      };
    });
  }

  function historyRows(){
    return (data.dues||[]).filter(d=>(duePaid(d)&&d.paid_at)||(oldPaid(d)&&d.previous_debt_paid_at)).sort((a,b)=>{
      const bt=Math.max(new Date(b.paid_at||0).getTime(),new Date(b.previous_debt_paid_at||0).getTime());
      const at=Math.max(new Date(a.paid_at||0).getTime(),new Date(a.previous_debt_paid_at||0).getTime());
      return bt-at;
    });
  }

  function openHistory(){
    const rows=historyRows();let body='';
    for(const d of rows){
      body+='<tr><td><b>'+esc(unit(d.unit_id))+'</b><br><small>'+esc(occupant(d.unit_id).full_name||'—')+'</small></td>'+
        '<td>'+esc(String(d.period||'').slice(0,7))+'</td>'+
        '<td>'+(duePaid(d)?'<span class="history-paid">Ödendi</span>':'—')+'</td>'+
        '<td>'+(duePaid(d)&&d.paid_at?esc(trDate(d.paid_at)):'—')+'</td>'+
        '<td>'+(oldPaid(d)?'<span class="history-paid">Ödendi</span>':'—')+'</td>'+
        '<td>'+(oldPaid(d)&&d.previous_debt_paid_at?esc(trDate(d.previous_debt_paid_at)):'—')+'</td></tr>';
    }
    if(!body)body='<tr><td colspan="6" class="empty">Henüz tarihli ödeme kaydı bulunmuyor.</td></tr>';
    $('#modalRoot').innerHTML='<div class="modal-backdrop"><div class="modal wide payment-history-modal">'+
      '<div class="modal-head"><div><h3>Ödeme Geçmişi</h3><small>Aidat ve tamamen kapanan geçmiş borçların ödeme tarihleri</small></div></div>'+
      '<div class="modal-body"><div class="table-wrap"><table><thead><tr><th>Villa / Sakin</th><th>Dönem</th><th>Aidat</th><th>Aidat ödeme tarihi</th><th>Geçmiş borç</th><th>Geçmiş borç ödeme tarihi</th></tr></thead><tbody>'+body+'</tbody></table></div></div>'+
      '<div class="modal-foot"><button class="primary" id="closePaymentHistory">Kapat</button></div></div></div>';
    $('#closePaymentHistory').onclick=()=>{$('#modalRoot').innerHTML='';};
  }

  function offerFile(blob,name,title){
    const file=new File([blob],name,{type:blob.type});
    $('#modalRoot').innerHTML='<div class="modal-backdrop"><div class="modal file-delivery-modal"><div class="modal-head"><div><h3>'+esc(title)+'</h3><small>'+esc(name)+'</small></div></div><div class="modal-body"><p>Dosyayı cihazınıza kaydedebilir veya desteklenen uygulamalarla paylaşabilirsiniz.</p></div><div class="modal-foot file-delivery-actions"><button class="ghost" id="cancelFileDelivery">Kapat</button><button class="ghost" id="shareGeneratedFile">Paylaş</button><button class="primary" id="saveGeneratedFile">Kaydet</button></div></div></div>';
    $('#cancelFileDelivery').onclick=()=>{$('#modalRoot').innerHTML='';};
    $('#saveGeneratedFile').onclick=()=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast(name+' kaydedildi.');};
    $('#shareGeneratedFile').onclick=async()=>{if(!navigator.share||!navigator.canShare||!navigator.canShare({files:[file]}))return toast('Bu cihaz dosya paylaşımını desteklemiyor. Kaydet seçeneğini kullanabilirsiniz.','error');try{await navigator.share({files:[file],title:title});}catch(e){if(e.name!=='AbortError')toast('Dosya paylaşılamadı.','error');}};
  }

  async function exportExcel(){
    const rows=exportRows();if(!rows.length)return toast('Dışa aktarılacak aidat bulunamadı.','error');
    const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(rows);
    ws['!cols']=[{wch:12},{wch:24},{wch:11},{wch:13},{wch:12},{wch:13},{wch:22},{wch:14},{wch:19},{wch:25},{wch:22},{wch:20},{wch:19},{wch:14}];
    XLSX.utils.book_append_sheet(wb,ws,'Aidatlar ve Ödemeler');
    const bytes=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    offerFile(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Asrav_Sitesi_Aidatlar_Odemeler_'+new Date().toISOString().slice(0,10)+'.xlsx','Asrav Sitesi Aidat ve Ödemeleri');
  }

  async function exportPdf(){
    const rows=exportRows();if(!rows.length)return toast('Dışa aktarılacak aidat bulunamadı.','error');
    if(!window.jspdf||!window.jspdf.jsPDF)return toast('PDF bileşeni yüklenemedi.','error');
    const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a3'});
    doc.setFontSize(15);doc.text('Asrav Sitesi - Aidat ve Odeme Listesi',14,13);
    doc.setFontSize(8);doc.text('Olusturma: '+new Date().toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}),14,18);
    doc.autoTable({startY:22,head:[['Villa','Sakin','Donem','Son Odeme','Aidat','Aidat Durumu','Aidat Odeme Tarihi','Gecmis Borc','Gecmis Borc Durumu','Gecmis Borc Odeme Tarihi','Gecmis Borca Odenen','Kalan Gecmis Borc','Toplam Kalan','Durum']],body:rows.map(r=>[r.Villa,r.Sakin,r['Dönem'],r['Son Ödeme'],money(r.Aidat),r['Aidat Ödendi'],r['Aidat Ödeme Tarihi']||'—',money(r['Geçmiş Borç']),r['Geçmiş Borç Ödendi'],r['Geçmiş Borç Ödeme Tarihi']||'—',money(r['Geçmiş Borca Ödenen']),money(r['Kalan Geçmiş Borç']),money(r['Toplam Kalan Borç']),r.Durum]),styles:{fontSize:6,cellPadding:1.5,overflow:'linebreak'},headStyles:{fillColor:[35,91,95]}});
    offerFile(doc.output('blob'),'Asrav_Sitesi_Aidatlar_Odemeler_'+new Date().toISOString().slice(0,10)+'.pdf','Asrav Sitesi Aidat ve Ödemeleri');
  }

  function mount(){
    if(page!=='dues')return;
    const actions=$('.dues-io-actions');
    if(actions&&!$('#openPaymentHistory'))actions.insertAdjacentHTML('afterbegin','<button class="ghost" id="openPaymentHistory">Ödeme Geçmişi</button>');
    const history=$('#openPaymentHistory'),excel=$('#exportDuesExcel'),pdf=$('#exportDuesPdf');
    if(history)history.onclick=openHistory;if(excel)excel.onclick=exportExcel;if(pdf)pdf.onclick=exportPdf;
  }

  const style=document.createElement('style');
  style.textContent='.payment-history-modal table{min-width:850px}.payment-history-modal .modal-body{padding-top:8px}.history-paid{display:inline-flex;padding:3px 7px;border-radius:7px;background:#e5f5ee;color:#197253;font-size:11px;font-weight:800}.file-delivery-modal{max-width:520px!important}.file-delivery-modal .modal-body p{margin:0;color:#365860;line-height:1.6}.file-delivery-actions{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:8px!important}.permission-item small{display:none!important}.permission-list{gap:6px!important}.permission-item{min-height:0!important;padding:8px 10px!important}.permission-item span{gap:0!important}.permission-item b{font-size:12px!important;line-height:1.25!important}.permission-card .panel-head{padding:12px!important}.permission-card .panel-head>div>small{display:none!important}@media(max-width:760px){.payment-history-modal{width:calc(100vw - 20px)!important;max-height:calc(100dvh - 20px)!important}.payment-history-modal .modal-body{overflow:auto!important}#openPaymentHistory{grid-column:1/3}.file-delivery-actions{grid-template-columns:1fr!important}}';
  document.head.appendChild(style);
  const previousRender=render;render=function(){const result=previousRender();mount();return result;};mount();
})();
