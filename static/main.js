$(document).ready( function(){

  $('#hello').click( function(e){
    e.preventDefault();
    sendHiSocket();
  })

});

function sendHiSocket(){
  alert('hi');
}
