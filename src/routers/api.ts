import express, {
    json, Request, Response, NextFunction
} from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { updateCache } from "../index.js";

export const api = express.Router();

const apiRateLimiter = new RateLimiterMemory({
    points: 30,
    duration: 10800,
});

const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;

    apiRateLimiter.consume(ip)
        .then(() => {
            next();
        })
        .catch((rateLimiterRes) => {
            const retryAfter = rateLimiterRes.msBeforeNext / 1000;
            const rateLimitReset = new Date(Date.now() + rateLimiterRes.msBeforeNext);
            res.set({
                "Retry-After": retryAfter,
                "X-RateLimit-Reset": rateLimitReset
            });
            res.status(429).send({ error: "ratelimited", info: { retryAfter, rateLimitReset } });
        });
};

api.use(rateLimiterMiddleware);

api.post("/generate", json(), (req: Request, res: Response) => {
    const params = req.body;
    console.log(params);
    if (!params.url || !params.title || !params.type) {
        return res.status(400).json({ error: "bad request" });
    }

    //remove all special chars from the url and replace space with '-'
    params.url = decodeURI(params.url).replace(/[^a-zA-Z ]/g, "").replace(/\s+/g, "-");
    const randString = Math.random().toString(16).substring(2, 10);
    const incompleteUrl = decodeURI(params.url).replace(/\s+/g, "-");
    const url = `${encodeURI(incompleteUrl)}-${randString}`;
    params.cDateTime = new Date();

    updateCache(url, params);

    return res.json({ url });
});