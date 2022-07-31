const { check, validationResult, body } = require('express-validator');
const {v4 : uuidv4} = require('uuid')
var randomColor = require('randomcolor');
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
    let unixFrom = Date.now() - (6 * 60 * 60 * 1000)
    let unixTo = Date.now();
    if(req.body.fromDate && req.body.toDate){
        unixFrom = formatDate(req.body.fromDate)
        unixTo = formatDate(req.body.toDate)
    } 

     
    // if(req.body.fromDate == "Invalid Date" || req.body.toDate == "Invalid Date")  {
    //     unixFrom = formatDate(req.body.fromDate)
    //     unixTo = formatDate(req.body.toDate)
    // }
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const ipObject = {};
    let index = 0;
    // if(req.body.ipList){
        req.body.ipList.forEach(function(value) {
        index++;
        const ipKey = ":ip"+index;
        ipObject[ipKey.toString()] = value;
    });

    const params = {
        TableName : config.serverUsage,
        FilterExpression : "addedOn between  :from and :to and ip IN ("+Object.keys(ipObject).toString()+ ")",
        //ExpressionAttributeValues : ipObject
        ExpressionAttributeValues: { 
            ...ipObject,
            ":from": unixFrom,
            ":to" : unixTo,
        }
    };
    docClient.scan(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            const dataList = data.Items.sort((a, b) => parseFloat(a.addedOn) - parseFloat(b.addedOn));
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

                
                const colorList = ['rgb(255,0,255)','rgb(0,100,0)','rgb(255, 99, 132)','rgb(255,69,0)','rgb(153,50,204)','rgb(72,61,139)','rgb(25,25,112)','rgb(0,139,139)','rgb(46,139,87)','rgb(128,128,0)']
                const datasets = []
                Object.keys(ipWiseData).map( (i,p) => {
                    let color;
                    if(p < colorList.length) {
                        color = colorList[p]
                    } else {
                        color = randomColor()
                    }
                    datasets.push({
                        "label":i,
                        "data": ipWiseData[i],
                        //borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', borderWidth: 0.5
                        borderColor : color,
                        borderWidth: 0.5,
                        backgroundColor : color.slice(0, -1)+", 0.5)"
                    })
                })
                return res.status(200).json({
                    message: {
                        labels,
                        datasets
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
