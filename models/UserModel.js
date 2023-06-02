import mongoose from 'mongoose';
const userSchema = mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    password:String
})

const userModel = mongoose.model('users', userSchema);
export default userModel;