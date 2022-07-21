var app = require('http').createServer();
var io = require('socket.io')(app);
var cookie_reader = require('cookie');
var querystring = require('querystring');
var redis = require('redis');
var sub = redis.createClient();

app.listen(4000);

//Subscribe to the Redis chat channel
sub.subscribe('announcement');
sub.subscribe('task');
sub.subscribe('pending');
sub.subscribe('app_count');
sub.subscribe('checkout_docs');
sub.subscribe('doc_summary');

io.on('connection', function(socket){

	sub.on('message', function(channel, message){
		if(channel == "announcement")
		{
			socket.emit('announcement', message);
		}
		if(channel == "task")
		{
			socket.emit('task', message);
		}
		if(channel == "pending"){
			socket.emit('pending', message);
		}
		if(channel == "checkout_docs") socket.emit('checkout_docs', message);
		if(channel == "doc_summary") socket.emit('doc_summary', message);
		if(channel == "app_count"){
			socket.emit('app_count', message);
		}
	});
});
