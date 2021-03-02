const express = require("express");
const app = express();
const mongoose = require("mongoose");
const url = "mongodb+srv://Sharan:chubb@12@cluster0.kfo7u.mongodb.net/URLshortner?retryWrites=true&w=majority";
const userModel = require('./models/UserModel.js');
const urlModel = require('./models/URLModel.js');
const bcrypt= require('bcryptjs');
const json = require('jsonwebtoken');
const cors = require('cors');
app.use(cors());

app.use(express.json());
app.listen(process.env.PORT || 3000);


app.get("/",(req,res)=>{
    res.send({Status:"Hello World"});
})

//Authentication Function
async function authenticate(req,res,next)
{
    if(req.headers.authorization)
    {
        json.verify(req.headers.authorization,"URLSHORTNER",function(err,result){
            if(result)
            {
                next();
            }
            else
            {
                res.status(401).json({Status:"Not Authorized"});
            }
        });
    }
    else
    {
        res.status(401).json({Status:"No token present"});
    }
}

//check token
app.post('/checkToken',(req,res)=>{
    if(req.body.token)
    {
        json.verify(req.body.token,"URLSHORTNER",function(err,result){
            if(result)
            {
                res.status(200).json({Status:"Authorized"});
            }
            else
            {
                res.status(401).json({Status:"Not Authorized"});
            }
        });
    }
    else
    {
        res.status(401).json({Status:"No token present"});
    }
})

//Create new User
app.post('/createuser',async (req,res)=>{
    try {
            mongoose.connect(url,{useNewUrlParser:true});
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password,salt);
            req.body.password = hash;
            const user = new userModel(req.body);
            user.createdon = Date.now();
            user.lastactive = Date.now();
            await user.save();
            mongoose.disconnect();
            res.status(200).json({Status:"User Created"});
    } catch (error) {
        res.status(500).json(error); 
    }  
})

//Login
app.post('/login',async (req,res)=>{
    try {
            mongoose.connect(url,{useNewUrlParser:true});
            const user = await userModel.findOne({email:req.body.email});
            mongoose.disconnect();
            if(user)
            {
                let result = await bcrypt.compare(req.body.password,user.password);
                if(result)
                {
                    let token = json.sign({_id:user._id},"URLSHORTNER")
                    res.status(200).json({Status:"Success",token});
                }
                else
                {
                    res.status(401).json({Status:"Password Incorrect"});
                }
            }
            else
            {   
                res.status(404).json({Status:"User Not Found"});
            }
    } catch (error) {
        res.status(500).json(error); 
    }  
})



app.get('/:short',async(req,res)=>{
    try {
        shortid = req.params.short;
        mongoose.connect(url,{useNewUrlParser:true});
        const out = await urlModel.findOne({'shorturl':shortid});
        mongoose.disconnect();
        if(out){
        var tarea = out.url;
        if (tarea.indexOf("http://") != 0 && tarea.indexOf("https://") != 0) {
                out.url = "http://" + out.url;
        }        
        res.status(200).json({url:out.url});
        }
        else{
            res.status(404).json({Status:"No URL Found"})
        }
    } catch (error) {
        res.status(500).json(error);
    }
})

app.post('/shortenURL',authenticate,async(req,res)=>{
    try
    {
        token = req.headers.authorization;
        const decoded = json.decode(token);
        id = decoded._id;
        mongoose.connect(url,{useNewUrlParser:true});
        while(true){
            var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var result = '';
            for ( var i = 0; i < 6; i++ ) {
                result += randomChars.charAt(Math.floor(Math.random() * 6));
            }
            const check = await urlModel.find({shorturls:result});
            if(check.length!=0)
            {
                continue;
            }
            break;
        }
        req.body.shorturl = result;
        const output = new urlModel(req.body);
        await output.save();
        await userModel.findByIdAndUpdate(mongoose.Types.ObjectId(id),{$push:{shorturls:output._id}});
        mongoose.disconnect();
        res.status(200).json({output,Status:"Success"});
    }
    catch(error)
    {
        res.status(500).json(error);
    }
})


app.get('/get/urls',authenticate,async(req,res)=>{
    try
    {
        token = req.headers.authorization;
        const decoded = json.decode(token);
        id = decoded._id;   
        mongoose.connect(url,{useNewUrlParser:true});
        shorturlData = await userModel.findById(mongoose.Types.ObjectId(id));
        shorturls = shorturlData.shorturls;
        output = await urlModel.find({'_id':{$in:shorturls}});
        mongoose.disconnect();
        res.status(200).json({output,Status:"Success"});
    }
    catch(error)
    {
        res.status(500).json(error);
    }
})

app.get('/get/totalurls',async (req,res)=>{
    try
    { 
        mongoose.connect(url,{useNewUrlParser:true});
        output = await (await urlModel.find({})).length;
        console.log(output);
        mongoose.disconnect();
        res.status(200).json({output,Status:"Success"});
    }
    catch(error)
    {
        res.status(500).json(error);
    }
})


app.get('/get/userDetails',authenticate,async(req,res)=>{
    try
    {
        token = req.headers.authorization;
        const decoded = json.decode(token);
        id = decoded._id;  
        mongoose.connect(url,{useNewUrlParser:true});
        output = await userModel.findById(mongoose.Types.ObjectId(id)).select({firstname:1,lastname:1,email:1,mobileno:1,_id:0});
        mongoose.disconnect();
        res.status(200).json({output,Status:"Success"});
    }
    catch(error)
    {
        res.status(500).json(error);
    }
})
