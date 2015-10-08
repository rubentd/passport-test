var socket = io.connect('http://localhost:3000');

socket.on('hello', function(data){
  alert(data.msg);
});

socket.on('wink', function(data){
  alert(data.msg);
});

socket.on('handshake', function(data){
  console.log('connection to socket server successful');
});


$(document).ready( function(){

  $('#hello').click( function(e){
    e.preventDefault();
    sendHiSocket();
  });

  $('#wink').click( function(e){
    e.preventDefault();
    sendWinkSocket();
  });

});

function sendHiSocket(){
  console.log('emitting hello');
  socket.emit('hello', {msg: 'hello'});
}

function sendWinkSocket(){
  console.log('emitting wink');
  socket.emit('wink', {msg: 'wink'});
}
