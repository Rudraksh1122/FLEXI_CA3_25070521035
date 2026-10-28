import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  exchange:{type:mongoose.Schema.Types.ObjectId,ref:'Exchange',required:true},
  scheduledAt:{type:Date,required:true},
  notes:{type:String,default:'',maxlength:500},
  status:{type:String,enum:['scheduled','completed','cancelled'],default:'scheduled'}
},{timestamps:true});
export default mongoose.model('Session',schema);
