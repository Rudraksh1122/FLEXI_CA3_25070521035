import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{const token=localStorage.getItem('skillswap_token');if(!token){setLoading(false);return;}api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>localStorage.removeItem('skillswap_token')).finally(()=>setLoading(false));},[]);
 const login=async credentials=>{const {data}=await api.post('/auth/login',credentials);localStorage.setItem('skillswap_token',data.token);setUser(data.user);return data.user;};
 const register=async payload=>{const {data}=await api.post('/auth/register',payload);localStorage.setItem('skillswap_token',data.token);setUser(data.user);return data.user;};
 const logout=()=>{localStorage.removeItem('skillswap_token');setUser(null);};
 const refresh=async()=>{const {data}=await api.get('/auth/me');setUser(data.user);return data.user;};
 return <AuthContext.Provider value={{user,loading,login,register,logout,refresh,setUser}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
