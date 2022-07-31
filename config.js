require('dotenv').config()
module.exports = {
    tableName: 'server',
    serverUsage: 'serverUsage',
    remoteConfig: {
      accessKeyId: process.env.DBACCESSID,
      secretAccessKey: process.env.DBACCESSKEY,
      region: process.env.REGION,
    }
};