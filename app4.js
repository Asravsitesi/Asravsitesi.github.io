async function saveProfile(id){const role=$('#r-'+id).value,unitId=$('#u-'+id).value||null,{error}=await db.rpc('set_profile_access',{target_user_id:id,target_role:role,target_unit_id:unitId?+unitId:null});if(error)toast(error.message);else{toast('Yetki güncellendi.');loadAll()}}
db.auth.onAuthStateChange((_e,s)=>boot(s));db.auth.getSession().then(({data:{session:s}})=>boot(s));
