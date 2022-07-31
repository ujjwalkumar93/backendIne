# BACKEND APP

A node.js app to fetch and visualize the server data

## Installation

```bash
yarn install
add .env file in root folder and add dynmodb key and secret and port
```

## API endpoints
```javascript
add server[POST] url/api/server/add      body: ip(string),serverName(string),serverStatus(boolean)

update server[PUT] url/api/server/update/:ip  body: serverName(string),serverStatus(boolean)

delete server[DELETE] url/api/server/delete/:ip

report[POST]      url/api/usage/:reportName   reportName must be in [cpu,disk,memory] 
                  body ipList[list] fromDate(dd/mm/yyyy) toDate(dd/mm/yyyy)
```
