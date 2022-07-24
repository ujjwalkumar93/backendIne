const AWS = require('aws-sdk');
const config = require('../config');
const {v4 : uuidv4} = require('uuid')

//  funcion to push the random data to aws dynmodb on every minute
addMetrics = () => {
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.tableName
    };
    docClient.scan(params, function (err, data) {
        if (data.Items) {
            data.Items.map(d => {
                const cpuMin = 0
                const cpuMax = 1000
                const memoryMin = 0
                const memoryMax = 100
                const diskMin = 0
                const diskMax = 100
                const cpu =  Math.floor(Math.random() * (cpuMax - cpuMin + 1)) + cpuMin;
                const memory =  Math.floor(Math.random() * (memoryMax - memoryMin + 1)) + memoryMin;
                const disk =  Math.floor(Math.random() * (diskMax - diskMin + 1)) + diskMin;
                pushData(d.ip,cpu, memory, disk)
            })
        } else {
            console.log("error occured")
        }
    });
}

const pushData = (ip,cpu, memory, disk) => {
    AWS.config.update(config.remoteConfig);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const item = {
        _id: uuidv4(),
        ip: ip,
        cpu: cpu,
        memory: memory,
        disk: disk,
        addedOn: Date.now()
    }
    const params = {
        TableName: config.serverUsage,
        Item: item,
        ReturnValues: 'ALL_OLD'
    }
    docClient.put(params, function(err, item){
        if(err){
            console.error({error: err})
        } else {
            console.log({data: item})
        }
    })
}

module.exports = addMetrics