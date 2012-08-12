var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

app.set('view engine', 'ejs')
app.set('view options', {layout: false})
app.set('views', __dirname + "/views")
app.use("/static", express.static(__dirname + "/static"))

app.get('/', function(req, res) {
    res.render('index');
});

server.listen(process.env.VMC_APP_PORT || 8080, null);

io.set('log level', 1);
io.sockets.on('connection', function(socket) {
    socket.on('postImage', function(data) {
        socket.broadcast.emit('postImage', data);
    });
});