const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const PORT = 3000;

const { getWeatherNewsData, getAPOD, getNewsByKeyword } = require('./api.js');
const {User, UserRequest} = require('./models/UserModel.js');


const uri =  'mongodb+srv://batyrhan2211:Batyr1337@cluster0.4myjt5o.mongodb.net/atlaspractice?retryWrites=true&w=majority';

mongoose.connect(uri);

const app = express();
const userStore = new Map();


app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//index page

app.get("/", async (req, res) => {
  const sessionId = req.query.sessionId;

  const user = userStore.get(sessionId);

  res.render("index", { sessionId: sessionId ? sessionId : null, user: user ? user : null, error: null });
});

//login page

app.get("/login", async (req, res) => {
  const sessionId = req.query.sessionId;
  res.render("login", {sessionId: sessionId ? sessionId : null, user: null, err: null});
});

app.post('/login', async (req, res) => {
  let sessionId = req.query.sessionId;
  const { username, password } = req.body;
  console.log(username, password);

  try {
    const user = await User.findOne({ username });
    console.log(user);

    if (!user) {
      return res.render("login", { sessionId: sessionId ? sessionId : null, error: "User does not exist", user: null });
    }

    if (password !== user.password) {
      return res.render("login", { sessionId: sessionId ? sessionId : null, error: "Invalid password", user: null });
    }


    sessionId = generateSessionId();
    userStore.set(sessionId, user);
    res.redirect(`/?sessionId=${sessionId}`);
    await UserRequest.create({user: user._id, request_route: "/login", request_data: username, timestamp: new Date(), response_data: "logged in"});
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

//logout 

app.get('/logout', async (req, res) => {

  const sessionId = req.body.sessionId;
  const user = userStore.get(sessionId);
  if (user){
    await UserRequest.create({user: user._id, request_route: "/logout", request_data: "", timestamp: new Date(), response_data: "logged out"});
  }
  userStore.delete(sessionId);
  res.redirect('/');
});

//weather form submission

app.post("/weatherForm", async (req, res) => {
  const sessionId = req.body.sessionId;
  
  const city = req.body.city || "Astana";
  console.log(city)
  res.redirect(`/weather?sessionId=${sessionId}&city=${city}`);
});

//weather page

app.get("/weather", async (req, res) => {
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);    
  const city = req.query.city || "Astana";
  console.log(city)
  
  try {
    const weatherNewsData = await getWeatherNewsData(city);

    if (!weatherNewsData) {
      return res.render('weather', { sessionId: sessionId, user: user ? user : null , error: "Write correct City !"})
    }

    res.render("weather", { 
      sessionId: sessionId ? sessionId : null,
      user: user ? user : null,
      weatherNewsData: weatherNewsData
    });
    if (user){
      await UserRequest.create({user: user._id, request_route: "/weather", request_data: city, timestamp: new Date(), response_data: weatherNewsData});
    }
  } catch (error) {
    console.error(`Error making HTTPS request to weather: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

//search news form

app.post('/search-news', async (req, res) => {
  const sessionId = req.body.sessionId;
  console.log(sessionId)

  const keyword = req.body.keyword;
  res.redirect(`/news?sessionId=${sessionId}&keyword=${keyword}`);
});

//news page

app.get('/news', async (req, res) => {
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);
  const keyword = req.query.keyword;

  try {
    const articles = await getNewsByKeyword(keyword);
    res.render('news', { sessionId: sessionId ? sessionId : null, articles: articles, user: user ? user : null, });
    if (user && keyword){
      await UserRequest.create({user: user._id, request_route: "/news", request_data: keyword, timestamp: new Date(), response_data: articles});
    }
  } catch (error){
    console.error(`Error making HTTPS request to news: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

//apod page

app.get('/apod', async (req, res) => {
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);

  try {
    const apodData = await getAPOD();
    res.render('apod', { sessionId: sessionId ? sessionId : null, apod:  apodData, user: user ? user : null});
    if (user){
      await UserRequest.create({user: user._id, request_route: "/apod", request_data: "", timestamp: new Date(), response_data: apodData});
    }
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    res.render('apod', { sessionId: sessionId ? sessionId : null, apod: null, user: user ? user : null });
  }
});

//history page

app.get("/history", async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const user = userStore.get(sessionId); 

    if (!user) {
      return res.redirect("/login"); 
    }

    const userRequests = await UserRequest.find({ user: user._id }).sort({ timestamp: -1 });

    res.render("history", { sessionId: sessionId ? sessionId : null, user: user ? user : null, userRequests: userRequests });
  } catch (error) {
    console.error("Error retrieving user's requests history:", error);
    res.status(500).send("Internal Server Error");
  }
});

//view user's previous requests data

app.get("/view-response", async (req, res) =>{
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);

  try {
    const requestId = req.query.requestId;
    const requestObj = await UserRequest.findOne({_id: requestId});
    const requestRoute = requestObj.request_route;
    const route = requestRoute.slice(1);
    const responseData = requestObj.response_data;
    console.log(route)
    if(route == "weather"){
      res.render(route, {sessionId: sessionId ? sessionId : null, user: user ? user : null , weatherNewsData: responseData});
    } else if (route == "apod"){
      res.render(route, {sessionId: sessionId ? sessionId : null, user: user ? user : null , apod: responseData});
    } else if (route == "news"){
      res.render(route, {sessionId: sessionId ? sessionId : null, user: user ? user : null , articles: responseData});
    }
    
  } catch (error) {
    console.error("Error retrieving user request's response data:", error);
    res.status(500).send("Internal Server Error");
  }
  
});


app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});

//utility function 

function generateSessionId() {
  return uuidv4();
}