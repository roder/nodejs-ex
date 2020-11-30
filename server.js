const { json } = require('express');
const os = require("os");
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const networkInfo = {};
const http = require('http');
const fs = require('fs');

//Path to key and cert
const sslKey = "/tmp/ssl/key.pem";
const sslCert = "/tmp/ssl/cert.pem";

// safely handles circular references
JSON.safeStringify = (obj, indent = 2) => {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
};

//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    sslport = process.env.SSLPORT || process.env.OPENSHIFT_NODEJS_SSLPORT || 4443,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

    
    
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // internal (i.e. 127.0.0.1) addresses
        if (!net.internal) {
            if (!networkInfo[name]) {
                networkInfo[name] = [];
            }

            networkInfo[name].push(net.address);
        }
    }
}

app.get('*',function (req, res) {
  res.setHeader('Content-Type','application/json');
  let msg = {
    "machine-name": os.hostname(),
    "network": networkInfo,
    "headers": req.headers,
    "cookies": req.cookies,
    "hostname": req.hostname,
    "method": req.method,
    "params": req.params,
    "path": req.path,
    "protocol": req.protocol,
    "query": req.query,
    "route": req.route
  }
  res.status(200).send(JSON.safeStringify(msg));
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

const httpServer = http.createServer(app);
httpServer.listen(port, ip, ()=>{
  console.log('Server running on http://%s:%s', ip, port);
});

try {
  if (fs.existsSync(sslKey) && fs.existsSync(sslCert)) {
    const https = require('https');
    const httpsServer = https.createServer({
      key: fs.readFileSync(sslKey),
      cert: fs.readFileSync(sslCert)
    },app);
    httpsServer.listen(sslport, ip, ()=>{ 
      console.log('SSL Server running on https://%s:%s', ip, sslport);
    });
  }
} catch(err) {
  console.error(err)
}

module.exports = app ;
