import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  exchange:{type:mongoose.Schema.Types.ObjectId,ref:'Exchange',required:true},
  reviewer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  reviewee:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  score:{type:Number,required:true,min:1,max:5},
  comment:{type:String,default:'',maxlength:500}
},{timestamps:true});
schema.index({exchange:1,reviewer:1},{unique:true});
export default mongoose.model('Rating',schema);
