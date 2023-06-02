import mongoose from 'mongoose'

export default async function dbConnect(){
 
    try {
        await mongoose.connect('mongodb://localhost:27017/bookingapp');
        console.log('connection success')
    } catch (error) {
        console.log(error.message)
    }

    
        
    }
  