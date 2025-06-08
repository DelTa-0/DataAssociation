const express = require('express');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
// const multer = require('multer');
const upload = require('./config/multerconfig');
const path = require('path');

const userModel = require('./models/user');
const postModel = require('./models/post');
const { log } = require('console');
// const crypto = require('crypto');

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());


//Direct way to use multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/images/uploads')
//   },
//   filename: function (req, file, cb) {
    
//     crypto.randomBytes(12,function(err,bytes){
//         const fn=bytes.toString("hex")+path.extname(file.originalname)
//         cb(null, fn)
//     })
   
//   }
// })

// const upload = multer({ storage: storage })

// Redirect to login or profile based on token
app.get('/', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/register");

    try {
        jwt.verify(token, "secret");
        res.redirect("/profile");
    } catch (err) {
        res.redirect("/login");
    }
});


//upload profile picture
app.get('/profile/upload', (req, res) => {
    res.render("profileupload")
});

app.post('/profile/upload',isLoggedIn,upload.single("image"), async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    user.profilepic=req.file.filename;
    await user.save();
    res.redirect("/profile")
    
})

app.get('/register',(req,res)=>{
    res.render('index')
})



// Registration route
app.post('/register', async (req, res) => {
    try {
        const { username, name, age, email, password } = req.body;
        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(400).send("User already registered");

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = await userModel.create({
            username, name, age, email, password: hash
        });

        const token = jwt.sign({ email, userid: user._id }, "secret");
        res.cookie("token", token);
        res.send("Registration done");
    } catch (err) {
        res.status(500).send("Registration failed");
    }
});

// Protected profile page
app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email }).populate('posts');
    res.render("profile", { user });
});

// like
app.get('/like/:id', isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({ _id: req.params.id }).populate('user');
    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid);
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
        
    await post.save();
    res.redirect("/profile");
});


//edit functionality
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate('user');
    
    res.render("edit",{post});
});

//edit functionality
app.post('/update/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id },{content:req.body.content});
    
    res.redirect("/profile");
});

// Create a post
app.post('/post',isLoggedIn, async (req, res) => {
    try {
        const { content } = req.body;
        const user = await userModel.findOne({ email: req.user.email });

        const post = await postModel.create({
            user: user._id,
            content
        });

        user.posts.push(post._id);
        await user.save();
        await user.populate('posts');

        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Failed to create post");
    }
});

// Login
app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password");

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        const token = jwt.sign({ email, userid: user._id }, "secret");
        res.cookie("token", token);
        res.redirect("/profile");
    } else {
        res.redirect("/login");
    }
});

// Logout
app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

// Middleware to check login
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const data = jwt.verify(token, "secret");
        req.user = data;
        next();
    } catch (err) {
        res.redirect("/login");
    }
}

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
