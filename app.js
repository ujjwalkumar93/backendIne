const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverRoutes = require("./routes/server")
const AWS = require('aws-sdk');
const config = require('./config');
const addMetrics = require("./controllers/script")
//const addMetrics = require("./controllers/script")

const app = express();

// code to send server matrics to dynmodb on every minute
setInterval(addMetrics,1000*60*60);

// middleware
app.use(bodyParser.json());
app.use(cors());

// routes
app.use("/api",serverRoutes)

const port = 8000;
app.listen(port, () => {
    console.log(`app is running on port ${port}`);
})