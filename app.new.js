
/**
 * Module dependencies.
 */

var express = require('express');
var partials = require('express-partials');
var routes = require('./routes');
var http = require('http');
var cluster = require('cluster');
var os = require('os');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');
var pjax = require('express-pjax');
//handler error log

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});



var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(partials());
app.use(pjax());
app.use(flash());
//app.use(express.favicon());
app.use(express.favicon(path.join(__dirname, 'public/images/alusa.ico')));
//app.use(express.logger('dev'));
app.use(express.logger({stream : accessLog}));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.bodyParser());//=json + urlencode + multipart
app.use(express.bodyParser({ keepExtensions: true, uploadDir: path.join(__dirname, 'public/images/' + settings.uploadPath) }));

app.use(express.methodOverride());

app.use(express.cookieParser());

app.use(express.session({
	secret : settings.cookieSecret,
	key : settings.db,
	cookie : {maxAge : 1000 * 60 * 60 * 24 * 30},
	store : new MongoStore({
		db : settings.db
	}, function(e){
		app.use(app.router);
		app.use(express.static(path.join(__dirname, 'public')));


		//log error
		app.use(function(err, req, res, next) {
			var meta = '[' + new Date() + '] ' + req.url + '\n';
			errorLog.write(meta + err.stack + '\n');
			next();
		});



		app.use(function(err, req, res, next) {
			if(!err) return next(); // you also need this line
		    res.render("500");
		});


		// development only
		if ('development' == app.get('env')) {
		  app.use(express.errorHandler());
		}

		routes(app);

		if(cluster.isMaster)
		{
			for(var i = 0; i < os.cpus().length; i++) 
			{
				console.log("cluster: " + (i + 1) + " start");
		        cluster.fork();
			}

			cluster.on('listening', function(worker, address){
				console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address:' + address.address + ":" + address.port);
			});

			cluster.on('exit', function(worker, code, signal) {
				console.log('worker ' + worker.process.pid + ' died');
			});
		}
		else
		{
			console.log('[worker] ' + "start worker ..." + cluster.worker.id);
			http.createServer(app).listen(app.get('port'), function(){
				console.log('Express server listening on port ' + app.get('port'));
			});
		}
	})
}));

