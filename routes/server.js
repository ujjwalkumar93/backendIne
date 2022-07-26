const express = require('express');
const {addServer, getServerList, updateServer, deleteServer, getServerDetails, getReport} = require("../controllers/server")
const { body, validationResult } = require('express-validator');
const router = express.Router();

// bydefault status of server would be considered as active
// so validation is applied only on ip address and server name
router.post("/server/add", [
    body("ip", "IP should be minimum of 7 char including '.'").isLength({min: 7}),
    body("serverName", "Server name can not be blank").isLength({min: 1}),
    body("serverStatus", "Server status must be boolean").isBoolean(),
], addServer)

router.get("/server/list", getServerList)
router.put("/server/update/:ip", updateServer)
router.delete("/server/delete/:ip", deleteServer)
router.get("/server/:ip", getServerDetails)
router.post("/usage/:name", getReport)

module.exports = router;