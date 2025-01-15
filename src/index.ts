import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { createClient } from "redis";
import * as dotenv from "dotenv";


dotenv.config();

var cors = require('cors');
const app = express();
const corsoption = {
    origin: '*',
    credentials: true
}
app.use(cors(corsoption));
const port = 3001;


app.use(bodyParser.json());

const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 15964,
    }
});

redisClient.on("connect", () => {
    console.log("Connected to Redis!");
});

redisClient.on("error", (err : Error) => {
    console.error("Redis connection error:", err);
});

(async () => {
    await redisClient.connect();
})();

const generateRandomId = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

app.post('/api/v1/send', async (req: any, res: any) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ error: "Data is required" });
        }

        const randomId = generateRandomId();
        const expirationTime = 6 * 60 * 60; 

        await redisClient.setEx(randomId, expirationTime, data);

        res.status(201).json({ id: randomId, message: "Data stored successfully" });
    } catch (error) {
        console.error("Error storing data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/v1/receive/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        if (!id || id.length !== 4) {
            return res.status(400).json({ error: "Invalid ID format. It should be a 4-digit number." });
        }

        const data = await redisClient.get(id);

        if (!data) {
            return res.status(404).json({ error: "Data not found or expired" });
        }

        res.status(200).json({ id, data });
    } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
