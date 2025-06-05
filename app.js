const express = require('express');
const userModel = require('./models/user');
const postModel = require('./models/post');

const app=express();

app.get('/',(req,res)=>{
    res.send('hello');
})

app.get('/create',async(req,res)=>{
    let createduser=await userModel.create({
        username:"madhav",
        email:"madhav@gmail.com",
        age:18
    })
    res.send(createduser);
})




app.listen(3000);