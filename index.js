import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dbConnect from './dbconnection.js';
import userModel from './models/UserModel.js';
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';
import fs from  'fs'
import {  hashSync ,genSaltSync,compareSync} from 'bcrypt'
import imageDownloader from 'image-downloader'
import placemodel from './models/PlaceModel.js';
const __dirname = path.resolve();
const app = express();
const bcryptSalt = genSaltSync(10)
const jwtsecret = 'hehemysecret'
app.use('/uploads', express.static(path.join(__dirname ,'/uploads')))
app.use(express.json())
app.use(morgan('dev'));
app.use(cors({credentials: true, origin:'http://localhost:5173'}))
app.use(cookieParser())

dbConnect()
app.get('/test', (req, res) => {
    res.send('success')
});

app.post('/register', async (req, res) => {
    try {
            const { name, email, password } = req.body;

    const user = await userModel.create({
        name,
        email, password: hashSync(password, bcryptSalt)
    })
    res.json(user);
    } catch (error) {
        console.log(error.message)
    }

})

app.get('/profile',async (req,res)=>{
    const {token} = req.cookies
    console.log(token)
    if(token) {
        jwt.verify(token, jwtsecret, {}, async (err,user)=> {
            if(err) throw err;
            const {name,email,_id} = await userModel.findById(user.id)
            res.json({name,email,_id})
        })
    }else {
        res.json(null);
    }
    // res.json({'token':'token' })
})

app.post('/login', async (req,res)=>{
    try {
        const {email,password} = req.body;
        const user = await userModel.findOne({email});
        if(user){
            const passOk = compareSync(password,user.password)

            if(passOk){
                jwt.sign({email:user.email, id:user._id,name:user.name},jwtsecret,{expiresIn:'1d'}, (err,token)=>{
                    if(err) throw err;
                    res.cookie('token',token).json(user)
                })
            
            }else{
                res.json({'status':'failed'})
            }
                
        }else{
            res.json('not found')
        }
    } catch (error) {
        
    }
})

app.post('/logout',(req,res) => {
    res.cookie('token','').json(true)
})

app.post('/upload-by-link',async(req,res)=>{
    try {
       const {link} = req.body
    const newName = 'photo' +Date.now()+'.jpg';
    await imageDownloader.image({
        url:link,
        dest: __dirname + '/uploads/' + newName,
    })
    res.json('uploads/'+newName); 
    } catch (error) {
        console.log(error)
    }
    
})

const photosMiddleware = multer({dest:'uploads'});

app.post('/upload',photosMiddleware.array('photos',100), (req,res)=> {
    const uploadedFiles = [];
    for(let i=0; i<req.files.length; i++){
        const {path,originalname } = req.files[i];
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' +ext;

        fs.renameSync(path, newPath)
        uploadedFiles.push(newPath)
    }
    res.json(uploadedFiles)
} )

app.post('/places', (req, res)=>{
    const {token} = req.cookies
    const {title,address, addedPhotos,description,perks, extraInfo,checkIn,checkOut,macGuests } =req.body
    jwt.verify(token, jwtsecret, {}, async (err,user)=> {
        if(err) throw err;
        const placeDoc = await placemodel.create({
                owner:user.id,
                title,
                address,
                photos:addedPhotos,
                description,
                perks,
                extraInfo,
                checkIn,
                checkOut,
                maxGuests:macGuests,
            })
    })
   
})


app.listen(4000, () => console.log('listening on http://localhost:4000'))