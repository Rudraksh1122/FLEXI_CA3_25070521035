import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  exchange:{type:mongoose.Schema.Types.ObjectId,ref:'Exchange',required:true,index:true},
  sender:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  text:{type:String,required:true,trim:true,maxlength:2000}
},{timestamps:true});
export default mongoose.model('Message',schema);
