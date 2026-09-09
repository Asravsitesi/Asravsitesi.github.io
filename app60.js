(()=>{
const ZONE='Europe/Istanbul',codePattern=/\s*\[[A-Z]+-[A-Z0-9]+\]\s*/g;
function stripCodes(v){return String(v?.message||v||'').replace(codePattern,' ').replace(/\s{2,}/g,' ').trim()}
function friendlyError(v){const raw=stripCodes(v),s=raw.toLocaleLowerCase('tr-TR');
 if(/invalid login|invalid_credentials|email or password|wrong password/.test(s))return'E-posta adresi veya şifre hatalı.';
 if(/jwt|session|not authenticated|session not found|oturum|401/.test(s))return'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.';
 if(/rate|security purposes|too many|429/.test(s))return'Çok sık işlem yapıldı. Lütfen en az 60 saniye bekleyin.';
 if(/permission|forbidden|row-level|42501|403|yetki/.test(s))return'Bu işlem için yetkiniz bulunmuyor.';
 if(/duplicate|23505|unique/.test(s))return'Aynı kayıt sistemde zaten bulunuyor.';
 if(/23503|foreign key/.test(s))return'İlişkili kayıt bulunamadığı için işlem yapılamadı.';
 if(/23502|required|null value/.test(s))return'Zorunlu alanları eksiksiz doldurun.';
 if(/23514|check constraint/.test(s))return'Girilen bilgiler izin verilen kurallara uymuyor.';
 if(/failed to fetch|network|internet|timeout|timed out|dns/.test(s))return'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
 if(/storage|bucket|upload/.test(s))return'Dosya işlemi tamamlanamadı. Lütfen tekrar deneyin.';
 if(/quota|limit exceeded|insufficient disk|read-only/.test(s))return'Sistem kullanım sınırına yaklaştı. Yönetici bilgilendirildi.';
 if(/cannot read properties|cannot set properties|referenceerror|typeerror|syntaxerror|is not defined|is not a function/.test(s))return'Uygulama ekranında beklenmeyen bir durum oluştu. Lütfen sayfayı yenileyip tekrar deneyin.';
 if(/[a-z]{4,}\s+[a-z]{4,}/i.test(raw)&&!/[çğıöşüÇĞİÖŞÜ]/.test(raw))return'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
 return raw||'İşlem tamamlanamadı. Lütfen tekrar deneyin.'}
const originalToast=toast;toast=function(text,type='success',ms=4200){const clean=type==='error'?friendlyError(text):stripCodes(text);return originalToast(clean,type,ms)};
const originalAlert=window.alert;window.alert=function(text){return originalAlert(friendlyError(text))};
for(const name of ['toLocaleString','toLocaleDateString','toLocaleTimeString']){const original=Date.prototype[name];Date.prototype[name]=function(locales,options){const opts={...(options||{})};if(!opts.timeZone)opts.timeZone=ZONE;return original.call(this,locales||'tr-TR',opts)}}
window.asravTurkeyTime=value=>new Date(value).toLocaleString('tr-TR',{timeZone:ZONE});
new MutationObserver(()=>{const tag=[...document.querySelectorAll('#healthContent+.tag,.toolbar .tag')].find(x=>/^Build\s/i.test(x.textContent||''));if(tag&&tag.textContent!=='Build 2589')tag.textContent='Build 2589'}).observe(document.body,{childList:true,subtree:true});
})();
