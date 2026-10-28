import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  title:{type:String,required:true,trim:true,maxlength:80},
  category:{type:String,default:'Other',trim:true},
  description:{type:String,required:true,trim:true,maxlength:1000},
  level:{type:String,enum:['Beginner','Intermediate','Advanced'],default:'Beginner'}
},{timestamps:true});
export default mongoose.model('Skill',schema);
