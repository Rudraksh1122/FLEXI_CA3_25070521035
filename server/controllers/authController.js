import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const safe=u=>({id:u._id,name:u.name,email:u.email,bio:u.bio,location:u.location,teachSkills:u.teachSkills,learnSkills:u.learnSkills,createdAt:u.createdAt});
const tokenFor=u=>jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:'7d'});
export async function register(req,res,next){
 try{
  const {name,email,password}=req.body;
  if(!name?.trim()||!email?.trim()||!password)return res.status(400).json({message:'Name, email, and password are required.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({message:'Enter a valid email address.'});
  if(password.length<8)return res.status(400).json({message:'Password must be at least 8 characters.'});
  if(await User.findOne({email:email.toLowerCase().trim()}))return res.status(409).json({message:'An account with this email already exists.'});
  const user=await User.create({name:name.trim(),email:email.toLowerCase().trim(),password:await bcrypt.hash(password,12)});
  res.status(201).json({token:tokenFor(user),user:safe(user)});
 }catch(e){if(e.code===11000)return res.status(409).json({message:'An account with this email already exists.'});next(e);}
}
export async function login(req,res,next){
 try{
  const user=await User.findOne({email:String(req.body.email||'').toLowerCase().trim()}).select('+password');
  if(!user||!await bcrypt.compare(req.body.password||'',user.password))return res.status(401).json({message:'Email or password is incorrect.'});
  res.json({token:tokenFor(user),user:safe(user)});
 }catch(e){next(e);}
}
export function me(req,res){res.json({user:safe(req.user)});}
export async function updateMe(req,res,next){
 try{
  const {name,bio,location,teachSkills,learnSkills}=req.body;
  if(name!==undefined&&!String(name).trim())return res.status(400).json({message:'Name cannot be empty.'});
  const user=await User.findByIdAndUpdate(req.user._id,{
   ...(name!==undefined&&{name:String(name).trim()}),
   ...(bio!==undefined&&{bio:String(bio).slice(0,500)}),
   ...(location!==undefined&&{location:String(location).slice(0,100)}),
   ...(Array.isArray(teachSkills)&&{teachSkills:teachSkills.map(String).map(s=>s.trim()).filter(Boolean).slice(0,15)}),
   ...(Array.isArray(learnSkills)&&{learnSkills:learnSkills.map(String).map(s=>s.trim()).filter(Boolean).slice(0,15)})
  },{new:true,runValidators:true});
  res.json({user:safe(user)});
 }catch(e){next(e);}
}
