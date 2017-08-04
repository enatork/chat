var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname)));

var rooms = new Set();

var messages = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

io.on('connection', function(socket){
      // once a client has connected, we expect to get a ping from them saying what room they want to join
    socket.on('room', function(room) {
    	if(room){
    		rooms.add(room);
    	}    	
    	if(messages[room]){
    		messages[room].forEach(function(message){
    		  if(message.type === 'text'){
    			  io.sockets.connected[socket.id].emit('message logs', message.message);	
		  	  }
			  else{
			  		io.sockets.connected[socket.id].emit('user image', message.userName, message.message);
    		  }
    		});
    	}
    	else{
    		messages[room] = [];
    	}
        socket.join(room);
        io.emit('room add', {'rooms' : Array.from(rooms)});
    });

    socket.on('chat message', function(msg){
      messages[msg.room].push({'type': 'text', 'message': '<li><p><b>' + socket.username + ': </b></p>' + '<span>' + msg.message + '</span><span id="timestamp">' + msg.time + '</span></li>'});
      io.sockets.in(msg.room).emit('chat message', socket.username, msg.message);
    });

    socket.on('adduser', function(username){
      socket.username = username;
      usernames[username] = username;
      // echo to client they've connected
      socket.emit('updatechat', 'SERVER', 'you have connected');
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
      // update the list of users in chat, client-side
      // io.sockets.emit('updateusers', usernames);
    });

  socket.on('user image', function (msg) {
      //Received an image: broadcast to all
        messages[msg.room].push({'type': 'image', 'message': msg.image, userName: socket.username});
        io.sockets.in(msg.room).emit('user image', socket.username, msg.image);
  });

  socket.on('leave room', function(room){
  	socket.leave(room);
  	messages[room] = [];
  	rooms.delete(room);
  	io.emit('room removed', room);
  	io.emit('room add', {'rooms' : Array.from(rooms)});
  });

  socket.on('active', function(data){
  	socket.broadcast.to(data.room).emit('user active', data.user);
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});