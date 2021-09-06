const express = require("express");
const session = require('express-session')
const path = require("path");

const https = require('https');
const http = require('http');
const fs = require('fs');

const { MongoClient } = require('mongodb');

const bodyParser = require('body-parser').json();
const dotenv = require("dotenv");
//const { title } = require("process");
dotenv.config();

const URL = process.env.mongourl
const mongoClient = new MongoClient(URL, { useNewUrlParser: true, useUnifiedTopology: true });

const PORT = process.env.port || 3000;
const httpPORT = process.env.httpport || 8080

let collection;
let database;
let info = {}

const app = express()

app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs')
app.use((req, res, next) => {
    req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
})

async function connect() {
    await mongoClient.connect(); 
    await mongoClient.db("main").command({ ping: 1 });
    console.log("Connected successfully to db and fetched main collection.");
    
    const database = mongoClient.db("main"); 
    collection = database.collection("rickroll");
}
connect().catch(console.dir);

app.get('/', async (req, res) => {
    const result = await collection.findOne({_id:"TotalRRCount"})

    res.render("index" , {rrCount: result.value || "Error"});
})

app.get('/posts/:url', (req, res) => {
    handleRR(req , res);
})

app.get('/news/:url', (req, res) => {
    handleRR(req , res);
})

app.get('/blogs/:url', (req, res) => {
    handleRR(req , res);
})

app.get('/data', async (req , res) => {
    const params = req.query
    const result = await collection.findOne({_id:encodeURI(params.url)})

    res.render('stats', {noClicks: result ? result.value : 0 , title: params.url})
})

app.post('/gen/rr', bodyParser, (req, res) => {
    const params = req.body
    
    if (!params.url || !params.title){
        res.status(400).send({error: "bad request"})
    }

    info[params.url] = {title: params.title , description: params.description , ImgUrl: params.ImgUrl}
    console.log(info)
    //keep title and descp in an array in {} then use when needed
})

async function create(url , title , descp , ImgUrl , result){
    const cDateTime = new Date();
    if (!result){
        await collection.insertOne({_id: url , value:0 , title , description: descp , ImgUrl , createDate:cDateTime})
        console.log(`created index for url ${url}!`)
    }
}

async function handleRR(req , res){
    const url = req.params.url;
    const value = {
        $inc: {
          value: 1
        },
      };
    await collection.updateOne({_id:"TotalRRCount"} , value)

    const result = await collection.findOne({_id: url})
    let title;
    let descp;
    let ImgUrl;
    if (result){
        const title = result.title //maybe here
        if (result.description){
            const descp = result.description
        } else {
            const descp = ""
        }

        if (result.ImgUrl){
            const ImgUrl = result.ImgUrl
        } else {
            const ImgUrl = ""
        }
    } else {
        if (!info[url]) {
            
        }
        title = info[url].title
        descp = info[url].description || ""
        ImgUrl = info[url].ImgUrl || ""
        create(url, title, descp, ImgUrl, result)
        //todo - pop url key from info 
    }

    //add count 
    await collection.updateOne({_id:url} , value)

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`lmfao ez rickroll got a person at ${ip}`)
    res.render('rickroll', {title, description: descp , ImgUrl});
}

const options = {
    key: fs.readFileSync(__dirname + '/key.pem'),
    cert: fs.readFileSync(__dirname +  '/cert.pem')
};

http.createServer(app).listen(httpPORT, () => {
    console.log(`listening on http://localhost:${httpPORT}`);
});
https.createServer(options , app).listen(PORT, () => {
	console.log(`listening on https://localhost:${PORT}`);
});