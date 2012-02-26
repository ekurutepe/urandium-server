
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    knox = require('knox');


var pg = require('pg');

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

app.get('/init', function(req, res, next) {

    console.log(process.env.DATABASE_URL);
    
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if(err) {
            console.log(err)
            
            res.json({err: 'could not connect to db'});
        }
        else {
            
            var query = client.query("CREATE TABLE photos ( pid SERIAL, timestamp TIMESTAMP, url VARCHAR(255), type VARCHAR(8), lat REAL, lng REAL );");

            query.on('end', function(dbResult) {
                res.json({result: 'ok'});
            });
            query.on('error', function(error){
                res.json({error: 'db error: ' + JSON.stringify(error)});
            })
            


            
        }
    });
    
});

app.get('/drop', function(req, res, next) {

    console.log(process.env.DATABASE_URL);
    
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if(err) {
            console.log(err)
            
            res.json({err: 'could not connect to db'});
        }
        else {
            
            var query = client.query("DROP TABLE photos;");

            query.on('end', function(dbResult) {
                res.json({result: 'ok'});
            });
            query.on('error', function(error){
                res.json({error: 'db error: ' + JSON.stringify(error)});
            })
            


            
        }
    });
    
});

app.get('/list', function(req, res, next) {
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if(err) {
            console.log(err)
            
            res.json({err: 'could not connect to db'});
        }
        else {
            var query = client.query("SELECT * FROM photos;");
            
            var rows = '';

            query.on('row', function(row){
                rows += JSON.stringify(row) + '\n';
            })
            query.on('end', function(dbResult) {
                res.json({result: rows});
            });
            query.on('error', function(error){
                res.json({error: 'db error: ' + JSON.stringify(error)});
            })
            


            
        }
    });
});

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
        
        var s3Client = knox.createClient({
            key: 'AKIAJUXN42YLFXA235ZQ'
          , secret: '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'
          , bucket: 'urandium'
        });
        

        
        
        var filename = '/images/' + type + '-' + new Date().getTime() + '-' + randomString(8) + '.jpg';
        

        
        var req = s3Client.put(filename, {
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
        
        pg.connect(process.env.DATABASE_URL, function(err, client) {
            if(err) {
                console.log(err)

                res.json({err: 'could not connect to db'});
            }
            else {
                var query = client.query("INSERT INTO photos (timestamp, url, type, lat, lng) VALUES (now(), '"+filename+"', '"+ type + "', "+ lat +", "+ lng +" );");

                query.on('end', function(dbResult) {
                    res.json({result: 'ok'});
                });
                query.on('error', function(error){
                    res.json({error: 'db error: ' + JSON.stringify(error)});
                })




            }
        });
        
        
    }
    else {
        res.json({error:'no proper request', params: req.params, body: req.body});
        
    }
});

app.get('/photo', function(req, res, next){
    
    pg.connect(process.env.DATABASE_URL, function(err, client) {
        if(err) {
            console.log(err)
            
            res.json({err: 'could not connect to db'});
        }
        else {
            var query = client.query("SELECT * FROM photos WHERE type = 'raw';");
            
            var photos = [];

            query.on('row', function(row){
                photos.push(row);
            })
            query.on('end', function(dbResult) {
                
                var selectedPhoto = photos[Math.floor(Math.random() * photos.length)];
                
                console.log('selected photo: ' + JSON.stringify(selectedPhoto));
                
                var s3Client = knox.createClient({
                    key: 'AKIAJUXN42YLFXA235ZQ'
                  , secret: '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'
                  , bucket: 'urandium'
                });

                
                var result = null;
                s3Client.get(selectedPhoto.url).on('response', function(s3Response){
                  console.log(s3Response.statusCode);
                  console.log(s3Response.headers);
                  var headers = JSON.parse(s3Response.headers);
                  result = new Buffer(headers['content-length']);
                  var curOffset = 0;
                  s3Response.setEncoding('utf8');
                  s3Response.on('data', function(chunk){

                    result.write(chunk, curOffset);
                    curOffset += chunk.length;
                    console.log('chunk len: ' + chunk.length + ' curOffset: ' + curOffset);
                    
                  });
                  s3Response.on('end', function(r){
                    res.json({result: result.toString('base64')});
                  })
                }).end();


                
            });
            query.on('error', function(error){
                res.json({error: 'db error: ' + JSON.stringify(error)});
            })
            


            
        }
    });
    
    
    
});

var port = process.env.PORT || 3000;

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
