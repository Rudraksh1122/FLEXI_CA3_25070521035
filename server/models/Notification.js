import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  type:{type:String,default:'general'},
  message:{type:String,required:true,maxlength:300},
  read:{type:Boolean,default:false}
},{timestamps:true});
export default mongoose.model('Notification',schema);
