import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from './context/AuthContext';
import Layout from './components/Layout';
import {Landing,Login,Register} from './pages/PublicPages';
import {Dashboard,Discover,MySkills,Exchanges,Messages,Sessions,Notifications,Profile} from './pages/AppPages';
import {Loading} from './components/Ui';
function Protected(){const {user,loading}=useAuth();if(loading)return <Loading/>;return user?<Layout/>:<Navigate to="/login" replace/>;}
export default function App(){return <BrowserRouter><AuthProvider><Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/app" element={<Protected/>}><Route index element={<Dashboard/>}/><Route path="discover" element={<Discover/>}/><Route path="skills" element={<MySkills/>}/><Route path="exchanges" element={<Exchanges/>}/><Route path="messages" element={<Messages/>}/><Route path="sessions" element={<Sessions/>}/><Route path="notifications" element={<Notifications/>}/><Route path="profile" element={<Profile/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></AuthProvider></BrowserRouter>;}
