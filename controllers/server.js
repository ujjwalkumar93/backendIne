const { check, validationResult, body } = require('express-validator');
const {v4 : uuidv4} = require('uuid')
const moment = require('moment')
const AWS = require('aws-sdk');
const config = require('../config');
// const moment = require('moment');

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
    const ipObject = {};
    let index = 0;
    req.body.ipList.forEach(function(value) {
        index++;
        const ipKey = ":ip"+index;
        ipObject[ipKey.toString()] = value;
    });

    // const params = {
    //     TableName : config.serverUsage,
    //     FilterExpression : "ip IN ("+Object.keys(ipObject).toString()+ ")",
    //     ExpressionAttributeValues : ipObject
    // };

    const params = {
        TableName : config.serverUsage,
        FilterExpression : "addedOn between  :from and :to and ip IN ("+Object.keys(ipObject).toString()+ ")",
        //ExpressionAttributeValues : ipObject
        ExpressionAttributeValues: { 
            ...ipObject,
            ":from": formatDate(req.body.fromDate),
            ":to" : formatDate(req.body.toDate),
        }
    };
    docClient.scan(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            const dataList = data.Items.sort((a, b) => parseFloat(a.addedOn) - parseFloat(b.addedOn));
            // console.log("dataList is: ", dataList)
            //new code added
            const labels = dataList.map(d => {
                return moment(d.addedOn).format('DD/MM/YYYY h:mm:ss')
              })
            // const distinctIp = []
            let ipWiseData = {}
            dataList.forEach(d => { 
                if (!(d.ip in ipWiseData)){
                    ipWiseData[d.ip] = []
                }
            })

            if(["cpu","disk","memory"].includes(req.params.reportName)){
                const reporName = req.params.reportName
                dataList.forEach(d => { 
                    ipWiseData[d.ip].push(d[reporName])
                    const objKeyList = Object.keys(ipWiseData)
                    const ipToPushDefaultValue = objKeyList.filter(function(ip) {
                        return ip !== d.ip
                    })
                    ipToPushDefaultValue.forEach(d => {
                        ipWiseData[d].push(0)
                    })
                })
                
                return res.status(200).json({
                    message: {
                        labels: labels,
                        dataset:ipWiseData
                    }
                })
            } else {
                return res.status(200).json({"error": "chart name must be cpu,disk or memory"})
            }   
            
        }
    })

}

const formatDate = (date) => {
    const myDate = date.split("/");
    const newDate = new Date( myDate[2], myDate[1] - 1, myDate[0]);
    return newDate.getTime()
}



module.exports = {addServer, getServerList, deleteServer, updateServer, getServerDetails}
