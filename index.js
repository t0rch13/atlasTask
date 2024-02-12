const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const PORT = 3000;

const { getWeatherNewsData, getAPOD, getNewsByKeyword } = require('./api.js');
const User = require('./models/UserModel.js')

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

  res.render("index", { user: user ? user : null, error: null });
  // console.log(sessionId)
});

//login page

app.get("/login", async (req, res) => {
  res.render("login", {user: null, err: null});
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  try {
    const user = await User.findOne({ username });
    console.log(user);

    if (!user) {
      return res.render("login", { error: "User does not exist", user: null });
    }

    if (password !== user.password) {
      return res.render("login", { error: "Invalid password", user: null });
    }

    const sessionId = generateSessionId();
    userStore.set(sessionId, user);
    res.redirect(`/?sessionId=${sessionId}`);

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

//logout 

app.get('/logout', (req, res) => {

  const sessionId = req.body.sessionId;

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
  
  try {
    const city = req.query.city || "Astana";
    console.log(city)
    const weatherNewsData = await getWeatherNewsData(city);

    if (!weatherNewsData) {
      return res.render('weather', { user: user ? user : null , error: "Write correct City !"})
    }

    res.render("weather", {
      user: user ? user : null,
      city,
      weatherNewsData,
    });
  } catch (error) {
    console.error(`Error making HTTPS request to weather: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/news', async (req, res) => {
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);
  const keyword = req.query.keyword;

  try {
    const articles = await getNewsByKeyword(keyword);
    res.render('news', { articles: articles, user: user ? user : null, })
  } catch (error){
    console.error(`Error making HTTPS request to news: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/search-news', async (req, res) => {
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);

  console.log(sessionId)
  const keyword = req.query.keyword;
  res.redirect(`/news?sessionId=${sessionId}&keyword=${keyword}`);
});


app.get('/apod', async (req, res) => {
  const sessionId = req.query.sessionId;
  const user = userStore.get(sessionId);

  try {
    const apodData = await getAPOD();
    res.render('apod', { apod:  apodData, user: user ? user : null});
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    res.render('apod', { apod: null, user: user ? user : null });
  }
});


app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});


function generateSessionId() {
  return uuidv4();
}
