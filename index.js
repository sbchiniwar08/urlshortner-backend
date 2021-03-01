const express = require("express");
const app = express();
const mongoose = require("mongoose");
const url = "mongodb+srv://Sharan:chubb@12@cluster0.kfo7u.mongodb.net/URLshortner?retryWrites=true&w=majority";
const userModel = require('./models/UserModel.js');
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
        console.log(error);
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
        console.log(error);
        res.status(500).json(error); 
    }  
})


//Get all users
app.get('/users',async (req,res)=>{
    try {
            mongoose.connect(url,{useNewUrlParser:true});
            const users = await userModel.find({});
            mongoose.disconnect();
            res.status(200).json({users,Status:"User Found"});
    } catch (error) {
        console.log(error);
        res.status(500).json(error); 
    }  
})