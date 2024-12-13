import express from "express";
const app = express();

import bodyParser from "body-parser";
import {router } from "./routes/router.js";


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());


app.use(router) // set router 


export { app }