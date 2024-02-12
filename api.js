const axios = require("axios");
const WEATHER_API_KEY = "0cf3f5de822ed6c4e1bdb6901da1036e";
const NEWS_API_KEY = "27df3cb829584967b560725662dc7f47";
const GOOGLE_MAPS_API_KEY = "AIzaSyAGiuA9tp6RdD4No9aEzZ438n38NyMIN7M";
const NASA_API_KEY = "FYUgxA9FfcQbu2CxnHsUuNhfstLZjE24m9Dzykew";

async function getWeatherNewsData(city) {
    const fromDate = getFromDate();

    let responseWeather, weatherData, responseNews, newsData = null

    try {
        responseWeather = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
        weatherData = responseWeather.data;
    
        responseNews = await axios.get(`https://newsapi.org/v2/everything?q=${city}&searchIn=title&from=${fromDate}&language=en&sortBy=popularity&apiKey=${NEWS_API_KEY}`);
        newsData = responseNews.data;
    }   catch (error){
        console.error(`Error making HTTPS request to weather: ${error.message}`);
        return null;
    }

    if (!weatherData || !newsData){
        return null;
    }

    const icon = weatherData.weather[0].icon;

    const articles = newsData.articles.slice(0, 5);
    if (!articles) {
      articles = 'No articles found';
    }


    return {
        city: city,
        temp: weatherData.main.temp,
        description: weatherData.weather[0].description,
        imgURL: `https://openweathermap.org/img/wn/${icon}@2x.png`,
        latitude: weatherData.coord.lat,
        longitude: weatherData.coord.lon,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        countryCode: weatherData.sys.country,
        apiKeyMaps: GOOGLE_MAPS_API_KEY,
        articles: articles
    };
}

async function getAPOD() {
    const responseNASA = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    return responseNASA.data;
}

async function getNewsByKeyword(keyword) {
    const fromDate = getFromDate();
    
    let responseNews, newsData = null;

    try {
        responseNews = await axios.get(`https://newsapi.org/v2/everything?q=${keyword}&searchIn=title&from=${fromDate}&language=en&sortBy=popularity&apiKey=${NEWS_API_KEY}`);
        newsData = responseNews.data;
    } catch (error){
        console.error(`Error making HTTPS request to weather: ${error.message}`);
        return null;
    }

    const articles = newsData.articles.slice(0, 10);
    if (!articles) {
      articles = null;
    }

    return articles;
}


function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getFromDate() {
    const currentDate = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    const fromDate = formatDate(lastMonthDate);

    return fromDate;
}

module.exports = {getWeatherNewsData, getAPOD, getNewsByKeyword};