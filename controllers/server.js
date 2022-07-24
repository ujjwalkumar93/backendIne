const { check, validationResult, body } = require('express-validator');
const {v4 : uuidv4} = require('uuid')
const AWS = require('aws-sdk');
const config = require('../config');

const addServer = (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        console.log(errors.array()[0])
        return res.status(400).json(errors.array())
    }
    // adding server details to dynmoDB
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    req.body._id = uuidv4()
    req.body.addedOn = Date.now()
    const params = {
        TableName: config.tableName,
        Item: req.body
    }
    docClient.put(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            console.log("data", data)
            return res.status(200).json({
                message: "server added successfully"
            })
        }
    })
}

const getServerList = (req, res) => {
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.tableName
    };
    docClient.scan(params, function (err, data) {
        if (err) {
            res.status(500).json({
                error: err
            });
        } else {
            res.status(200).json({
                message : data.Items
            });
        }
    });
}

const updateServer = (req, res) => {
    // console.log("req is: ",req.body)
    // console.log(req.params.ip)
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.tableName,
        Key: {
            ip: req.params.ip
        },
        UpdateExpression: "set serverName = :serverName, serverStatus = :serverStatus",
        ExpressionAttributeValues: {
            ':serverName' : req.body.serverName,
            ':serverStatus' : req.body.serverStatus,
          }
    }


    docClient.update(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            //console.log("data is: ",data)
            return res.status(200).json({
                message: "server updated successfully"
            })
        }
    })
}

const deleteServer = (req, res) => {
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.tableName,
        Key: {
            ip: req.params.ip
        },
        "ReturnValues": "ALL_OLD"
    }

    docClient.delete(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            return res.status(200).json({
                message: "server deleted successfully"
            })
        }
    })
}

const getServerDetails = (req, res) => {
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.serverUsage,
        FilterExpression: "#ip = :ip",
        ExpressionAttributeNames: {
            "#ip": "ip",
        },
        ExpressionAttributeValues: {
            ":ip": req.params.ip,
        },
    }
    docClient.scan(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            //console.log("data", data)
            return res.status(200).json({
                message: data.Items
            })
        }
    })
}

module.exports = {addServer, getServerList, deleteServer, updateServer, getServerDetails}
