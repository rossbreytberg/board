var express = require('express'),
    io = require('socket.io'),
    userCount = 0;

var server = express.createServer(),
    io = io.listen(server);

server.set('view engine', 'ejs')
server.set('view options', {layout: false})
server.set('views', __dirname + "/views")
server.use("/static", express.static(__dirname + "/static"))

server.get('/', function(req, res) {
    res.render('index');
});

server.listen(8080);

io.set('log level', 1);
io.sockets.on('connection', function(socket) {
    userCount++;
    io.sockets.emit('userCountUpdate', userCount);
    socket.on('disconnect', function() {
        userCount--;
        io.sockets.emit('userCountUpdate', userCount);
    });
    socket.on('postImage', function(data) {
        socket.broadcast.emit('postImage', data);
    });
});