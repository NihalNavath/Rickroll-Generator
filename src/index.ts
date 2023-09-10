import * as mongoDB from "mongodb";
import * as path from "path";
import express, {
    Request, Response, NextFunction
} from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { config } from "dotenv";
config();

//trust proxy level
const PROXYLEVEL = 1;

const app = express();
app.set("trust proxy", PROXYLEVEL);
app.use(express.static(path.join(__dirname, "../public")));
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

import { api } from "./routers/api";
app.use("/api", api);

const topLevelRickrollPaths = ["/posts/:url", "/news/:url", "/blogs/:url"];
const incValue = {
    $inc: {
        value: 1
    },
};

let PORT: number | string;
let mongoClient: mongoDB.MongoClient;
let collection: mongoDB.Collection;
export const info = {};

const setup = async () => {
    const URL = process.env.mongourl;
    PORT = process.env.port || 3000;

    if (!URL) throw new Error("Env file not configured properly. 'mongourl' not found.");

    // mongoClient = new mongoDB.MongoClient(URL);

    // await mongoClient.connect();
    // await mongoClient.db("main").command({ ping: 1 });

    // const database = mongoClient.db("main");
    // collection = database.collection("rickroll");

    console.log("Connected successfully to db and fetched main collection.");

    if (collection) {
        return "Success";
    } else {
        return "Failed";
    }
};

const globalRatelimiter = new RateLimiterMemory({
    points: 100,
    duration: 1,
});

const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    console.log(ip);

    globalRatelimiter.consume(ip)
        .then(() => {
            next();
        })
        .catch((rateLimiterRes) => {
            const retryAfter = rateLimiterRes.msBeforeNext / 1000;
            const rateLimit = 3;
            const rateLimitRemainingPoints = rateLimiterRes.remainingPoints;
            const rateLimitReset = new Date(Date.now() + rateLimiterRes.msBeforeNext);
            res.set({
                "Retry-After": retryAfter,
                "X-RateLimit-Limit": rateLimit,
                "X-RateLimit-Remaining": rateLimitRemainingPoints,
                "X-RateLimit-Reset": rateLimitReset
            });
            res.status(429).render("ratelimited", { retryAfter, rateLimit, rateLimitRemainingPoints, rateLimitReset });
        });
};
app.use(rateLimiterMiddleware);


app.get("/", async (req: Request, res: Response) => {
    // const result = await collection.findOne({ _id: "TotalRRCount" }); //cache count maybe?

    const result = {value: 10000}

    if (!result) {
        throw new Error("Could not find total rickroll count, is the database not configured? run `npm run setup-db`");
    }

    res.render("index", { rrCount: result.value });
});

app.get("/faq", (req: Request, res: Response) => {
    res.render("faq");
});

app.get("/usage", (req: Request, res: Response) => {
    res.render("usage");
});

app.get(topLevelRickrollPaths, (req: Request, res: Response) => {
    handleRR(req, res);
});

interface args {
    url: string
}

app.get("/data", async (req: Request<unknown, unknown, unknown, args>, res: Response) => {
    const { query } = req;
    if (!query.url) return res.redirect("/");

    let result = await fetchFromDb(query.url);

    if (!result){
        //data not in db, try cache
        result = info[query.url]
    }

    const type = result ? result.type : "posts";

    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host;
    const link = `${req.protocol}://${host}/${type}/${query.url}`;


    res.render("stats", { noClicks: result ? result.value : 0, title: encodeURI(query.url), link });
});

const create = (url: string, title: string, description: string, type: string, expiry: string | number, imgUrl: string) => {
    const cDateTime = new Date();
    expiry = Number(expiry);
    if (expiry) {
        const expireAt = cDateTime.setDate(cDateTime.getDate() + expiry);
        collection.insertOne({ "link": url, value: 0, title, type, expiry, description, imgUrl, createDate: cDateTime, expireAt: expireAt });
    }
    else {
        collection.insertOne({ "link": url, value: 0, title, type, expiry, description, imgUrl, createDate: cDateTime });
    }

    console.log(`created index for url ${url}!`);
};

const fetchFromDb = async (url: string) => {
    let result: mongoDB.Document;
    result = await collection.findOne({ "link": url });
    //backwards compatibility, older version used "_id" field
    if (!result) result = await collection.findOne({ _id: url });
    return result;
};

const handleRR = async (req: Request, res: Response) => {
    let url: string;
    try {
        url = decodeURI(req.params.url);
    } catch (err) {
        return console.log(err);
    }

    const result = await fetchFromDb(url);
    if (!result && !info[url]) return res.render("invalid");

    let description: string;
    let type: string;
    let expiry: string;
    let ImgUrl: string;
    let title: string;

    if (result) {
        title = result.title;
        description = result.description;
        type = result.type;
        ImgUrl = result.ImgUrl;
    } else {
        title = info[url].title;
        description = info[url].description;
        type = info[url].type;
        expiry = info[url].expiry;
        ImgUrl = info[url].ImgUrl;
        create(url, title, description, type, expiry, ImgUrl);

        delete info[url];
    }

    //increment count
    await collection.updateOne({ _id: "TotalRRCount" }, incValue);
    await collection.updateOne({ "link": url }, incValue);

    res.render("rickroll", { title, description, ImgUrl });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateCache = (url: string, params: any) => {
    info[url] = { title: params.title, description: params.description, value: 0, type: params.type, expiry: params.expiry, ImgUrl: params.ImgUrl, createTime: params.cDateTime };
};

const serve = async () => {
    await setup().then(() =>
        app.listen(PORT, () => {
            console.log(`Listening on port ${PORT}`);
        })
    );
};

serve();
