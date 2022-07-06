const express = require("express");
const path = require("path");

const fs = require('fs');

const { MongoClient } = require('mongodb');

const bodyParser = require('body-parser').json();
const dotenv = require("dotenv");

dotenv.config();

const URL = process.env.mongourl
const mongoClient = new MongoClient(URL, { useNewUrlParser: true, useUnifiedTopology: true });

const PORT = process.env.port || 3000;

let collection;
let info = {}

app = express()

app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs')
// app.use((req, res, next) => {
//     req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
// })

async function connect() {
    await mongoClient.connect(); 
    await mongoClient.db("main").command({ ping: 1 });
    console.log("Connected successfully to db and fetched main collection.");
    
    const database = mongoClient.db("main"); 
    collection = database.collection("rickroll");
}
connect().catch(console.dir);

app.get('/', async (req, res) => {
    result = await collection.findOne({_id:"TotalRRCount"})

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
    if (!params.url || params.url === ""){
        return res.redirect('/');
    }

    result = await collection.findOne({_id:encodeURI(params.url)})
    type = result ? result.type : 'posts'

    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host 
    link = `${req.protocol}://${host}/${type}/${params.url}`


    res.render('stats', {noClicks: result ? result.value : 0 , title: encodeURI(params.url), link})
})

app.post('/gen/rr', bodyParser, (req, res) => {
    const params = req.body
    
    if (!params.url || !params.title || !params.type || params.title === ""){ 
        return res.status(400).send({error: "bad request"})
    }

    randString = Math.random().toString(16).substr(2, 8);
    const incompleteUrl = decodeURI(params.url).replace(/\s+/g, '-')
    const url = `${encodeURI(incompleteUrl)}-${randString}` 

    const cDateTime = new Date();

    info[url] = {title: params.title , description: params.description , type: params.type, ImgUrl: params.ImgUrl, createTime: cDateTime}
    console.log(info)
    
    return res.json({url})
})

async function create(url , title , descp , type , ImgUrl , result){
    if (!title || title === ""){
        return
    }
    const cDateTime = new Date();
    if (!result){
        await collection.insertOne({_id: url , value:0 , title , description: descp , type , ImgUrl , createDate:cDateTime})
        console.log(`created index for url ${url}!`)
    }
}

async function handleRR(req , res){
    const url = decodeURI(req.params.url);
    console.log(`protocol = ${url}`);
    const value = {
        $inc: {
          value: 1
        },
      };
    await collection.updateOne({_id:"TotalRRCount"} , value)

    result = await collection.findOne({_id:url})

    let descp;
    let type;
    let ImgUrl;
    let title;
    
    if(!result && !info[url]){
        return res.send("Not a valid rick roll link, create one at https://news.rr.nihalnavath.com/");
    }
    
    if (result){
        title = result.title 
        descp = result.description || null
        type = result.type || null
        ImgUrl = result.ImgUrl || null
    } else {
        title = info[url].title 
        descp = info[url].description || null
        type = info[url].type || null
        ImgUrl = info[url].ImgUrl || null
        create(url , title , descp , type, ImgUrl, result)
        
        //todo - pop url key from info 
        //todo - make handler for custom entered urls
    }

    //add count 
    await collection.updateOne({_id:url} , value)

    const loc = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`lmfao got a person at ${loc}`)

    res.render('rickroll', {title, description: descp , ImgUrl});
}

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
