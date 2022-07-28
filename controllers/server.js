const { check, validationResult, body } = require('express-validator');
const {v4 : uuidv4} = require('uuid')
const moment = require('moment')
const AWS = require('aws-sdk');
const config = require('../config');
const moment = require('moment');

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

    const params = {
        TableName : config.serverUsage,
        FilterExpression : "ip IN ("+Object.keys(ipObject).toString()+ ")",
        ExpressionAttributeValues : ipObject
    };

    docClient.scan(params, function(err, data){
        if(err){
            return res.status(500).json({
                error: err
            })
        } else {
            const dataList = data.Items.sort((a, b) => parseFloat(a.addedOn) - parseFloat(b.addedOn));
            return res.status(200).json({
                message: dataList
            })
        }
    })

}

const formatDate = (date) => {
    const myDate = date.split("/");
    const newDate = new Date( myDate[2], myDate[1] - 1, myDate[0]);
    return newDate.getTime()
}
const getReport = (req, res) => {
    
    if(req.body.fromDate === undefined || req.body.toDate === undefined ) {
        req.body.fromDate = "01-02-2022"
        req.body.toDate = "01-02-2024"
    }

    console.log("req.body is: ",req.body)
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.serverUsage,
        FilterExpression: `addedOn between  :from and :to`,
        // FilterExpression: `ip in ${x}`,
        ExpressionAttributeValues: { 
            ":from": formatDate(req.body.fromDate),
            ":to" : formatDate(req.body.toDate),
        }
    };

    docClient.scan(params, function (err, data) {
        if (err) {
            console.log("error................", err)
            res.status(500).json({
                error: err
            });
        } else {
            const d = prepareData(data.Items, req.body.ipList)
            res.status(200).json({
                message : d

            });
        }
    });

}

const prepareData = (dataList, ipList) => {
    selectedIpData = []
    const newArr = []
    const ipGroupData = []
    dataList.map(data => {
        //console.log("ipList.includes(data.ip) is: ", ipList.includes(data.ip))
        if(ipList.includes(data.ip)){
            selectedIpData.push(data)
        }
        
    })
    let timeWiseSortedData = selectedIpData.sort((a, b) => b.addeOn - a.addeOn);
        //console.log("sortedObjs: ", timeWiseSortedData)

    const ipWiseData = timeWiseSortedData.reduce(function(results, d) {
        (results[d.ip] = results[d.ip] || []).push(d);
        return results;
    }, {})
    //console.log("result: ",results)
    const ipData = Object.values(ipWiseData)
    
    //console.log("ipData.length: ",Object.values(ipWiseData).length)

    return makeData(ipData,ipList)
    //console.log("timeWiseShortedData: ",timeWiseSortedData)
    //return newArr
}

// function check(array) {
//     return array.reduce((r, a, i, { [i - 1]: b }) => a.map((v, j) => i
//             ? r[j] && b[j] < v
//             : true
//     ), []);
// }
const makeData = (arr,ipList) => {
    const readyData = []
    for(let i= 0;i<arr.length; i++) {
        let subData = []
        for(let j=0;j<arr[i].length; j++) {
            if(ipList.length - subData.length <= -1){
                subData = []
                subData.push(arr[i][j].addedOn)
            } else {
                subData.push(arr[i][j].cpu)
            }
            readyData.push(subData)
            
        }
    }
    return readyData
}


module.exports = {addServer, getServerList, deleteServer, updateServer, getServerDetails, getReport}
