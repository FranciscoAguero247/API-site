import 'dotenv/config.js';
import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

// 1. "Precision" Configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));


const kelvinToFahrenheit = (k) => Math.round(((k - 273.15) * 1.8) + 32);

const getWeatherCondition = (id) => {
    if (id >= 200 && id < 600) return 'rain';
    if (id >= 600 && id < 700) return 'snow';
    if (id >= 801) return 'clouds';
    return 'clear';
};


app.get("/", (req, res) => {
    res.render("index");
});

app.post("/submit", async (req, res) => {
    const { zipcode } = req.body;

 
    if (!zipcode) {
        return res.status(400).render("page404", { message: "Zipcode is required" });
    }

    try {
        
        const geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/zip`, {
            params: { zip: zipcode, appid: API_KEY }
        });

        const { lat, lon, name: cityName } = geoRes.data;

        const [weatherRes, forecastRes] = await Promise.all([
            axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                params: { lat, lon, appid: API_KEY }
            }),
            axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
                params: { lat, lon, appid: API_KEY }
            })
        ]);

        
        const current = weatherRes.data;
        const forecastList = forecastRes.data.list;

        
        const dailyForecast = forecastList.filter(item => item.dt_txt.includes("12:00:00")).map(item => ({
            day: new Date(item.dt * 1000).toLocaleDateString("en", { weekday: "long" }),
            temp: kelvinToFahrenheit(item.main.temp),
            icon: item.weather[0].icon
        }));

        res.render("index", {
            city: cityName,
            temperature: kelvinToFahrenheit(current.main.temp),
            icon: current.weather[0].icon,
            weatherDesc: current.weather[0].description,
            weatherCondition: getWeatherCondition(current.weather[0].id), 
            forecast: dailyForecast,   
            day: dailyForecast.map(d => d.day),
            weekIcon: dailyForecast.map(d => d.icon),
            temperatureWeekForecast: dailyForecast.map(d => d.temp)
        });

    } catch (error) {
        console.error("Metrological Engine Failure:", error.message);
        res.status(error.response?.status || 500).render("page500");
    }
});

app.listen(PORT, () => {
    console.log(`Siege Engine active on port ${PORT}`);
});