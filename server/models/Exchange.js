import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  requester:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  recipient:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  offeredSkill:{type:String,required:true,trim:true},
  wantedSkill:{type:String,required:true,trim:true},
  message:{type:String,default:'',maxlength:500},
  status:{type:String,enum:['pending','accepted','declined','cancelled','completed'],default:'pending'}
},{timestamps:true});
export default mongoose.model('Exchange',schema);
