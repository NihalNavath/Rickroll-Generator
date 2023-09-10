// import * as mongoDB from "mongodb";
// import { config } from "dotenv";
// config();

// let collection: mongoDB.Collection;

// const connect = async () => {
//     const URL = process.env.mongourl;
//     if (!URL) throw new Error("Env file not configured properly. 'mongourl' not found.");
//     const mongoClient = new mongoDB.MongoClient(URL);
//     await mongoClient.connect();
//     await mongoClient.db("main").command({ ping: 1 });
//     console.log("Connected successfully to db and fetched main collection.");

//     const database = mongoClient.db("main");
//     collection = database.collection("rickroll");
// };
// connect().then(() => {
//     flagHandler();
// }).catch(err => {
//     console.log(err);
// });

// const flagHandler = async () => {
//     const flags = process.argv.slice(2);
//     if (!flags.length) return await check();
//     for (let i = 0; i < flags.length; i++) {
//         switch (flags[i]) {
//             case "-get-count":
//                 get_count();
//                 break;
//             case "--reset-total-count":
//                 reset_count();
//                 break;
//             default:
//                 console.log("\x1b[31m%s\x1b[0m", `bad option ${flags[i]}`);
//                 break;
//         }
//     }
// };

// // Main //

// const get_count = async () => {
//     const count = await collection.findOne({ _id: "TotalRRCount" });
//     console.log(`Total rickroll count: ${count.value}`);
// };

// const reset_count = async () => {
//     await collection.updateOne(
//         { _id: "TotalRRCount" },
//         { $set: { count: 0 } },
//     );
//     console.log("Successfully reset total rickroll count to 0");
// };

// const check = async () => {
//     const globalRRCount = await collection.findOne({ _id: "TotalRRCount" });

//     if (!globalRRCount) {
//         await collection.insertOne({ _id: new mongoDB.ObjectId("TotalRRCount"), value: 0 });
//         await collection.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 });
//         console.log("Successfully created total rickroll count index. Database is ready.");
//     } else {
//         console.log("DB check completed, everything seems to be in order. Please pass appropriate flags if you want to interact with database.");
//     }
// };