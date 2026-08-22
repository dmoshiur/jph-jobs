'use client';
import { useState } from 'react';
import { api } from '@/services/api';
export default function Forgot(){const [e,setE]=useState('');const [s,setS]=useState(false);
  async function submit(ev:React.FormEvent){ev.preventDefault();await api.post('/auth/forgot-password',{email:e});setS(true);}
  return <div className="container section" style={{maxWidth:420}}><div className="panel card-pad"><h1>পাসওয়ার্ড পুনরুদ্ধার</h1>{s?<div className="alert alert-success">যদি অ্যাকাউন্ট থাকে, রিসেট লিংক পাঠানো হয়েছে।</div>:<form onSubmit={submit}><label className="field"><span className="label">ইমেইল</span><input type="email" value={e} onChange={x=>setE(x.target.value)} required/></label><button className="btn btn-block">রিসেট লিংক পাঠান</button></form>}</div></div>;}
