$(function () {
            
            var urlParams = new URLSearchParams(window.location.search);
            
            roomName = urlParams.get('room'); 
            name = urlParams.get('name') || 'user';

            var socket = io();
            var timeout;

            socket.on('connect', function() {
             // Connected, let's sign-up for to receive messages for this room
              socket.emit('adduser', name);
              socket.emit('room', roomName);
            });
            
            var currentImageBlob = null;

            function setChatHeight() {
                $('#messages').css('height', window.innerHeight - $('#chat-form').height());
            }

            setChatHeight();
            window.onresize = setChatHeight;

            function imageText(fileName) {
                $('#file-name').text(fileName);
            }
            function showImage(from, base64Img) {
                $('#messages').append($('<li>').append($('<p>').append($('<b>').text(from)), '<img class="uploaded-img" src="' + base64Img + '"/>').append($('<span id="timestamp">').text(getTime())));
            }

            function openLightbox(img) {
                console.log('here');
            }

            function sendImage() {
                var reader = new FileReader();
                reader.onload = function(evt){
                    // showImage('me', evt.target.result);
                    socket.emit('user image', {'image': evt.target.result, 'room': roomName, 'time': getTime()});
                    currentImageBlob = null;
                    imageText('');
                };
                reader.readAsDataURL(currentImageBlob);
            }

            $('#text-submit').submit(function() {
              socket.emit('chat message', {'message': $('#m').val(), 'room': roomName, 'time': getTime()});
              $('#m').val('');
              return false;
            });

            $('#image-submit').submit(function() {
                if (currentImageBlob) {
                    sendImage();
                }
                return false;
            });

            function userActive(){
                socket.emit('active', {'room' :roomName, 'user': name});
            }

            socket.on('user image', showImage);

            socket.on('user active', function(name){
                if(timeout){
                    clearTimeout(timeout);
                }
                var activeDiv = $("#notify-type");
                activeDiv.empty();
                activeDiv.append($('<p>').text(name + ' is typing'));
                activeDiv.show();
                timeout = window.setTimeout(function() {
                    activeDiv.hide();
                    activeDiv.empty();
                }, 1000);
            });

            socket.on('message logs', function(msg){
                $('#messages').append(jQuery.parseHTML(msg));
            });

            socket.on('chat message', function(from, msg){

              $('#messages').append($('<li><p><b>' + from + ': </b></p>').append($('<span>').text(msg)).append($('<span id="timestamp">').text(getTime())));
            });

            function getTime() {
                let date = new Date();
                return date.toLocaleTimeString();
            }

            $('#imagefile').bind('change', function(e) {
              var data = e.originalEvent.target.files[0];
              imageText(data.name);
              currentImageBlob = data;
            });

            window.addEventListener("keypress", userActive, false);
        });