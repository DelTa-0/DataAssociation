const express = require('express');
const userModel = require('./models/user');
const postModel = require('./models/post');
const post = require('./models/post');

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

//create post
app.get('/post/create',async(req,res)=>{
    let post =await postModel.create({
        postdata:"hello this is an example post",
        user:"684150fae7ff58a8a91f4445"
    })
    let user =await userModel.findOne({_id:"684150fae7ff58a8a91f4445"});
    user.posts.push(post._id);
    await user.save();
    res.send({post,user});
})




app.listen(3000);