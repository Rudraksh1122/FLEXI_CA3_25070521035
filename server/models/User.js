import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:80},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  password:{type:String,required:true,select:false},
  bio:{type:String,default:'',maxlength:500},
  location:{type:String,default:'',maxlength:100},
  teachSkills:[{type:String,trim:true}],
  learnSkills:[{type:String,trim:true}]
},{timestamps:true});
export default mongoose.model('User',schema);
