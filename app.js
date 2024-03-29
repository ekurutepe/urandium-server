
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    knox = require('knox');



var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
    
    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }
    
    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

app.get('/', routes.index);


app.post('/photo', function(req, res, next){
    
    var type = req.body.type;
    var lat = null;
    var lng = null;
    

    
    if (req.body.latLng) {
        var latLng = req.body.latLng.split(',');
        lat = latLng[0];
        lng = latLng[1];
        
    }
    
    var imgData = req.body.imageData;



    
        
    if (imgData && (type === 'raw' || type === 'final')) {
        
        var buf = new Buffer(imgData, 'base64');
        
        var client = knox.createClient({
            key: 'AKIAJUXN42YLFXA235ZQ'
          , secret: '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'
          , bucket: 'urandium'
        });
        
        var filename = '/images/' + type + '-' + new Date().getTime() + '-' + randomString(8) + '.jpg';
        var req = client.put(filename, {
                            'Content-Length': buf.length,
                            'Content-Type': 'application/octet-stream' });
                        
        
        req.on('response', function(res){
            console.log(res.statusCode);
            console.log(res.headers);
            res.on('data', function(chunk){
                console.log(chunk.toString());
            });
        });
        // Send the request with the file's Buffer obj
        req.end(buf);
        
        res.json({status:'ok'});
        
    }
    else {
        res.json({error:'no proper request', params: req.params, body: req.body});
        
    }
});

app.get('/photo', function(req, res, next){
    
    var client = knox.createClient({
        key: 'AKIAJUXN42YLFXA235ZQ'
      , secret: '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'
      , bucket: 'urandium'
    });
    
    var result = '';
    client.get('images').on('response', function(res){
      console.log(res.statusCode);
      console.log(res.headers);
      res.setEncoding('utf8');
      res.on('data', function(chunk){
        console.log(chunk);
        result += chunk;
      });
    }).end();
    
    res.json({result: result});
});

var port = process.env.PORT || 3000;

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
