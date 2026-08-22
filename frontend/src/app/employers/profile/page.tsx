'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
export default function EmployerProfile(){
  const {user,loading}=useAuth();const router=useRouter();const {toast}=useToast();
  const [f,setF]=useState({name:'',about:'',category:'',address:'',phone:'',email:'',website:''});
  useEffect(()=>{if(!loading&&!user)router.push('/auth/login');},[user,loading,router]);
  async function save(){try{await api.post('/companies',f);toast('কোম্পানি প্রোফাইল তৈরি হয়েছে','success');router.push('/dashboard/employer');}catch(e){toast(e instanceof Error?e.message:'ব্যর্থ','error');}}
  return <div className="container" style={{padding:'24px 0',maxWidth:720}}><h1>কোম্পানি প্রোফাইল তৈরি করুন</h1><div className="panel card-pad">
    <label className="field"><span className="label">কোম্পানির নাম</span><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>
    <label className="field"><span className="label">ক্যাটাগরি</span><input value={f.category} onChange={e=>setF({...f,category:e.target.value})}/></label>
    <label className="field"><span className="label">সম্পর্কে</span><textarea value={f.about} onChange={e=>setF({...f,about:e.target.value})}/></label>
    <div className="grid grid-2">
      <label className="field"><span className="label">ঠিকানা</span><input value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></label>
      <label className="field"><span className="label">ফোন</span><input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></label>
      <label className="field"><span className="label">ইমেইল</span><input value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></label>
      <label className="field"><span className="label">ওয়েবসাইট</span><input value={f.website} onChange={e=>setF({...f,website:e.target.value})}/></label>
    </div>
    <button className="btn" onClick={save}>সংরক্ষণ করুন</button>
  </div></div>;
}
