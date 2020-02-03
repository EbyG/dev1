var express=require("express");
var app=express();
var mongoose=require("mongoose");
var bodyParser=require("body-parser");
var Campground=require("./models/campground");
var seedDB=require("./seeds.js");

var Comment=require("./models/comment");
var passport=require("passport");
var LocalStratergy=require("passport-local");
var User=require("./models/user");


mongoose.connect("mongodb://localhost:27017/yelp_camp_6", { useNewUrlParser : true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));


   
/*app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
 });
 */
seedDB();


// Passport authentication
app.use(require("express-session")({
    secret:"Rusty is cute",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
    res.locals.currentUser = req.isAuthenticated();
    next();
 });
 

app.get("/",function(req,res)
{
    res.render("landing");
}
);

app.get("/campgrounds",function(req,res)
{
    //console.log(req.isAuthenticated());
    //console.log(req.authInfo);
    console.log(req.authenticate);
    Campground.find({},function(err,allcamps)
    {
        if(err)
        {
            console.log("error");
        }
        else{
            res.render("campgrounds/index",{campgrounds : allcamps});
        }
    })
    
});
app.post("/campgrounds",function(req,res){

    var name=req.body.name;
    var image=req.body.image;
    var desc=req.body.description;
    var newcampground={name:name, image:image,description:desc};
    Campground.create(newcampground,function(err,camp)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            res.redirect("/campgrounds");
        }
    })
    

});
app.get("/campgrounds/new",function(req,res){
    res.render("campgrounds/new.ejs");
});
app.get("/campgrounds/:id",function(req,res)
{
    
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            //console.log(foundCampground)
            /*res.send(foundCamp.name);*/
            res.render("campgrounds/show",{campground : foundCampground});
        }
        
    })
});

//=============================
//COMMENTS ROUTES
//=============================

//function isLoggedIn(req,res,next)
app.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res)
{
    //res.send("welcome to new comments");
    Campground.findById(req.params.id,function(err,campground)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            res.render("comments/new",{campground:campground})
        }
    })
    
});

app.post("/campgrounds/:id/comments",isLoggedIn,function(req,res)
{
    Campground.findById(req.params.id,function(err,camp)
    {
        if(err)
        {
            console.log(err);
            res.redirect("/campgrounds");
        }
        else
        {
            Comment.create(req.body.comment,function(err,comment)
            {
                if(err)
                {
                    console.log("hello");
                }
                else
                {
                    console.log("hello");
                    camp.comments.push(comment);
                    camp.save();
                    res.redirect('/campgrounds/'+camp._id);
                }
            })
        }
    })
})

//--------------------------
//Auth routes
//--------------------------

// show register form
app.get("/register", function(req, res){
   res.render("register"); 
});
//handle sign up logic
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/campgrounds"); 
        });
    });
});

// show login form
app.get("/login", function(req, res){
   res.render("login"); 
});
// handling login logic
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logic route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/campgrounds");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(80,function()
{
    console.log("the server has started");
});