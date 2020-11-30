const { json } = require('express');
const os = require("os");

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
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('*',function (req, res) {
  res.setHeader('Content-Type','application/json');
  let msg = {
    "machine-name": process.env.NAME,
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

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
