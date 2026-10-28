import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import {Server as SocketServer} from 'socket.io';
import connectDB from './config/db.js';
import api from './routes/api.js';
import auth from './middleware/auth.js';
import Exchange from './models/Exchange.js';

const app=express(), server=http.createServer(app);
const io=new SocketServer(server,{cors:{origin:process.env.CLIENT_URL||'http://localhost:5173',methods:['GET','POST']}});
app.set('io',io);
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173'}));
app.use(express.json({limit:'1mb'}));
app.get('/api/health',(req,res)=>res.json({status:'ok',service:'SkillSwap API'}));
app.use('/api',api);
io.use(async(socket,next)=>{
 try{
  const token=socket.handshake.auth?.token;
  if(!token)return next(new Error('Authentication required'));
  const jwt=(await import('jsonwebtoken')).default;
  const payload=jwt.verify(token,process.env.JWT_SECRET);
  socket.userId=payload.id;next();
 }catch{next(new Error('Invalid authentication token'));}
});
io.on('connection',socket=>{
 socket.on('conversation:join',async(exchangeId)=>{
  try{
   const ex=await Exchange.findOne({_id:exchangeId,$or:[{requester:socket.userId},{recipient:socket.userId}],status:{$in:['accepted','completed']}});
   if(ex)socket.join(String(ex._id));
  }catch{}
 });
});
app.use((req,res)=>res.status(404).json({message:'API endpoint not found.'}));
app.use((err,req,res,next)=>{
 console.error(err);
 if(err.name==='ValidationError')return res.status(400).json({message:err.message});
 if(err.name==='CastError')return res.status(400).json({message:'Invalid resource ID.'});
 res.status(500).json({message:process.env.NODE_ENV==='production'?'Something went wrong.':err.message||'Internal server error.'});
});
const port=process.env.PORT||5000;
connectDB().then(()=>server.listen(port,()=>console.log(`SkillSwap API listening on ${port}`))).catch(err=>{console.error('Database connection failed:',err.message);process.exit(1);});
