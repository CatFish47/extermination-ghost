/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');

var bodyParser = require('body-parser');

/* The http module is used to listen for requests from a web browser */
var http = require('http');

/* The path module is used to transform relative paths to absolute paths */
var path = require('path');

var mongoose = require('mongoose');

var dbAddress = process.env.MONGODB_URI || 'mongodb://127.0.0.1/spacecrash';

/* Creates an express application */
var app = express();

/* Creates the web server */
var server = http.createServer(app);

/* Defines what port to use to listen to web requests */
var port =  process.env.PORT
						? parseInt(process.env.PORT):
						8080;

function startServer() {

	app.use(bodyParser.json({ limit: '16mb' }));
	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/', (req, res, next) => {
		var filePath = path.join(__dirname, './index.html');

		res.sendFile(filePath);
	})

	app.post('/', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	})

	/* Defines what function to all when the server recieves any request from http://localhost:8080 */
	server.on('listening', () => {

		/* Determining what the server is listening for */
		var addr = server.address()
			, bind = typeof addr === 'string'
				? 'pipe ' + addr
				: 'port ' + addr.port
		;

		/* Outputs to the console that the webserver is ready to start listenting to requests */
		console.log('Listening on ' + bind);
	});

	/* Tells the server to start listening to requests from defined port */
	server.listen(port);

}

mongoose.connect(dbAddress, startServer);
