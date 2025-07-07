import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;
const API_KEY = "08320c34b5841d4c7f44b0de6bd6a635";

/**
 * retrive and convert zip code to lat and lon to get weather forecast
 */

app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended : true }));
app.set("view engine", "ejs");

app.get("/", (req, res) =>{
    res.render("index.ejs");
})

app.post("/submit", async (req, res) => {
    
    const zipCode = req.body["zipcode"];
    const resultGeocoding = await axios.get(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode}&appid=${API_KEY}`);

    const latitude = JSON.stringify(resultGeocoding.data.lat);
    const longtitude = JSON.stringify(resultGeocoding.data.lon);

    const resultWeather = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longtitude}&appid=${API_KEY}`);
    
    const iconCode = JSON.stringify(resultWeather.data.weather[0].icon);
    const cityNameStr = JSON.stringify(resultWeather.data.name);
    const cityName = cityNameStr.replace(/['"]+/g, '');
    /**
     * turn icon code to image in html page
     */

    const temperature = JSON.stringify(resultWeather.data.main.temp);
    const convretedTemperature = Math.round(((temperature - 273.15) * (9/5)) + 32);
    /**
     * add five day weather forecast to html page underneath weather block
     */
    const resultForecast = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longtitude}&appid=${API_KEY}`);
    let weatherList = resultForecast.data.list;

    let days =[];
    let tempList = [];
    let iconList = [];
    for (let i = 0; i < weatherList.length; i += 8) {
        const tempWeekForecast = Math.round((((weatherList[i].main.temp) - 273.15) * (9/5)) + 32);
        const weekForecastIcon = weatherList[i].weather[0].icon;
        let dayname = new Date(weatherList[i].dt * 1000).toLocaleDateString("en", {weekday: "long",});
        days.push(dayname);
        tempList.push(tempWeekForecast);
        iconList.push(weekForecastIcon);
    }

    res.render("index.ejs", {
        city : cityName, 
        temperature : convretedTemperature,
        icon : iconCode,
        weekIcon : iconList,
        day: days,
        temperatureWeekForecast : tempList
        });
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views/page404.html'));
});

app.use((err, req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views/page500.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});