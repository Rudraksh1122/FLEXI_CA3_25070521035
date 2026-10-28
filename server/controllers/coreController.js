import Skill from '../models/Skill.js';
import Exchange from '../models/Exchange.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import Rating from '../models/Rating.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
const notify=(owner,type,message)=>Notification.create({owner,type,message});
const ownExchange=(id,uid)=>Exchange.findOne({_id:id,$or:[{requester:uid},{recipient:uid}]});
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export async function listSkills(req,res,next){try{
 const q=String(req.query.q||'').trim(), filter=q?{$or:[{title:new RegExp(esc(q),'i')},{category:new RegExp(esc(q),'i')},{description:new RegExp(esc(q),'i')}]}:{};
 const skills=await Skill.find(filter).populate('owner','name location bio teachSkills learnSkills').sort({createdAt:-1}).limit(100);
 res.json({skills});
}catch(e){next(e)}}
export async function createSkill(req,res,next){try{
 const {title,description,category,level}=req.body;
 if(!title?.trim()||!description?.trim())return res.status(400).json({message:'Skill title and description are required.'});
 const skill=await Skill.create({owner:req.user._id,title:title.trim(),description:description.trim(),category:category||'Other',level:level||'Beginner'});
 res.status(201).json({skill});
}catch(e){next(e)}}
export async function getSkill(req,res,next){try{const skill=await Skill.findById(req.params.id).populate('owner','name location');if(!skill)return res.status(404).json({message:'Skill not found.'});res.json({skill});}catch(e){next(e)}}
export async function updateSkill(req,res,next){try{
 const skill=await Skill.findOne({_id:req.params.id,owner:req.user._id});if(!skill)return res.status(404).json({message:'Skill not found or not yours to edit.'});
 for(const k of ['title','description','category','level'])if(req.body[k]!==undefined)skill[k]=req.body[k];
 await skill.save();res.json({skill});
}catch(e){next(e)}}
export async function deleteSkill(req,res,next){try{const s=await Skill.findOneAndDelete({_id:req.params.id,owner:req.user._id});if(!s)return res.status(404).json({message:'Skill not found or not yours to delete.'});res.json({message:'Skill deleted.'});}catch(e){next(e)}}

export async function matches(req,res,next){try{
 const me=await User.findById(req.user._id), users=await User.find({_id:{$ne:me._id}}).select('name bio location teachSkills learnSkills');
 const norm=a=>new Set((a||[]).map(s=>s.toLowerCase().trim()));
 const mineTeach=norm(me.teachSkills),mineLearn=norm(me.learnSkills);
 const results=users.map(u=>{const t=norm(u.teachSkills),l=norm(u.learnSkills),canLearn=[...mineLearn].filter(s=>t.has(s)),canTeach=[...mineTeach].filter(s=>l.has(s));return{user:u,score:canLearn.length+canTeach.length,canLearn,canTeach};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 res.json({matches:results});
}catch(e){next(e)}}
export async function listExchanges(req,res,next){try{
 const exchanges=await Exchange.find({$or:[{requester:req.user._id},{recipient:req.user._id}]})
 .populate('requester','name email teachSkills learnSkills location').populate('recipient','name email teachSkills learnSkills location').sort({createdAt:-1});
 res.json({exchanges});
}catch(e){next(e)}}
export async function createExchange(req,res,next){try{
 const {recipient,offeredSkill,wantedSkill,message=''}=req.body;
 if(!recipient||!offeredSkill?.trim()||!wantedSkill?.trim())return res.status(400).json({message:'Choose a person and both exchange skills.'});
 if(String(recipient)===String(req.user._id))return res.status(400).json({message:'You cannot exchange skills with yourself.'});
 if(!await User.findById(recipient))return res.status(404).json({message:'Member not found.'});
 const exchange=await Exchange.create({requester:req.user._id,recipient,offeredSkill:offeredSkill.trim(),wantedSkill:wantedSkill.trim(),message});
 await notify(recipient,'exchange',`${req.user.name} sent you a skill exchange request.`);
 res.status(201).json({exchange});
}catch(e){next(e)}}
export async function updateExchange(req,res,next){try{
 const ex=await ownExchange(req.params.id,req.user._id);if(!ex)return res.status(404).json({message:'Exchange not found.'});
 const {status}=req.body;
 const allowed=status==='accepted'||status==='declined'?String(ex.recipient)===String(req.user._id)&&ex.status==='pending':status==='cancelled'?String(ex.requester)===String(req.user._id)&&ex.status==='pending':status==='completed'?ex.status==='accepted':false;
 if(!allowed)return res.status(400).json({message:'That status change is not allowed.'});
 ex.status=status;await ex.save();
 const other=String(ex.requester)===String(req.user._id)?ex.recipient:ex.requester;
 await notify(other,'exchange',`Your skill exchange request was ${status}.`);
 res.json({exchange:ex});
}catch(e){next(e)}}
export async function listMessages(req,res,next){try{
 const ex=await ownExchange(req.params.exchangeId,req.user._id);if(!ex)return res.status(404).json({message:'Conversation not found.'});
 if(!['accepted','completed'].includes(ex.status))return res.status(403).json({message:'Chat becomes available after the exchange is accepted.'});
 const messages=await Message.find({exchange:ex._id}).populate('sender','name').sort({createdAt:1}).limit(300);res.json({messages});
}catch(e){next(e)}}
export async function sendMessage(req,res,next){try{
 const ex=await ownExchange(req.params.exchangeId,req.user._id);if(!ex||!['accepted','completed'].includes(ex.status))return res.status(403).json({message:'Chat is not available for this exchange.'});
 const text=String(req.body.text||'').trim();if(!text)return res.status(400).json({message:'Message cannot be empty.'});
 const message=await Message.create({exchange:ex._id,sender:req.user._id,text});
 const other=String(ex.requester)===String(req.user._id)?ex.recipient:ex.requester;
 await notify(other,'message',`${req.user.name} sent you a message.`);
 const populated=await message.populate('sender','name');
 req.app.get('io')?.to(String(ex._id)).emit('message:new',populated);
 res.status(201).json({message:populated});
}catch(e){next(e)}}
export async function listSessions(req,res,next){try{
 const exs=await Exchange.find({$or:[{requester:req.user._id},{recipient:req.user._id}]},'_id');
 const sessions=await Session.find({exchange:{$in:exs.map(x=>x._id)}}).populate({path:'exchange',populate:[{path:'requester',select:'name'},{path:'recipient',select:'name'}]}).sort({scheduledAt:1});res.json({sessions});
}catch(e){next(e)}}
export async function createSession(req,res,next){try{
 const {exchange:exchangeId,scheduledAt,notes=''}=req.body,ex=await ownExchange(exchangeId,req.user._id);
 if(!ex||ex.status!=='accepted')return res.status(400).json({message:'Sessions require an accepted exchange.'});
 const date=new Date(scheduledAt);if(!scheduledAt||Number.isNaN(date.getTime())||date<=new Date())return res.status(400).json({message:'Choose a future session date.'});
 const session=await Session.create({exchange:ex._id,scheduledAt:date,notes});
 const other=String(ex.requester)===String(req.user._id)?ex.recipient:ex.requester;await notify(other,'session',`${req.user.name} scheduled a skill exchange session.`);
 res.status(201).json({session});
}catch(e){next(e)}}
export async function updateSession(req,res,next){try{
 const session=await Session.findById(req.params.id);if(!session)return res.status(404).json({message:'Session not found.'});
 if(!await ownExchange(session.exchange,req.user._id))return res.status(404).json({message:'Session not found.'});
 if(!['completed','cancelled'].includes(req.body.status))return res.status(400).json({message:'Invalid session status.'});
 session.status=req.body.status;await session.save();res.json({session});
}catch(e){next(e)}}
export async function createRating(req,res,next){try{
 const {exchange:exchangeId,score,comment=''}=req.body,ex=await ownExchange(exchangeId,req.user._id);
 if(!ex||ex.status!=='completed')return res.status(400).json({message:'You can rate a completed exchange only.'});
 const reviewee=String(ex.requester)===String(req.user._id)?ex.recipient:ex.requester;
 const rating=await Rating.create({exchange:ex._id,reviewer:req.user._id,reviewee,score:Number(score),comment});
 await notify(reviewee,'rating',`${req.user.name} left you a rating.`);res.status(201).json({rating});
}catch(e){if(e.code===11000)return res.status(409).json({message:'You have already rated this exchange.'});next(e)}}
export async function listRatings(req,res,next){try{
 const ratings=await Rating.find({reviewee:req.user._id}).populate('reviewer','name').sort({createdAt:-1});res.json({ratings});
}catch(e){next(e)}}
export async function listNotifications(req,res,next){try{const notifications=await Notification.find({owner:req.user._id}).sort({createdAt:-1}).limit(50);res.json({notifications});}catch(e){next(e)}}
export async function readNotification(req,res,next){try{const n=await Notification.findOneAndUpdate({_id:req.params.id,owner:req.user._id},{read:true},{new:true});if(!n)return res.status(404).json({message:'Notification not found.'});res.json({notification:n});}catch(e){next(e)}}
