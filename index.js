const express = require("express");
const http = require("http");
const socket = require("socket.io");
var app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socket(server);
var players;
var joined=true;
var games = Array(100); //we are going to have only 100 games at a time to save memory
for (let i = 0; i < 100; i++) {
  games[i] = { players: 0, pid: [0, 0] };
}
app.use(express.static(__dirname + "/")); //this is to serve the static files
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
io.on("connection", function (socket) {
  //we are going to assign a random player id to any player that joins the game, this random id can later be replaced with a username which we will fetch from the database after creating an authentication system
  var color;
  var playerid = Math.floor(Math.random() * 100 + 1);
  console.log(playerid + "Connected");
  socket.on("joined", function (roomId) {
    if (games[roomId].players < 2) {
      //checks if there are less than 2 players in the room
      games[roomId].players++;
      games[roomId].pid[games[roomId].players - 1] = playerid;
    } else {
      socket.emit("Full", roomId);
      return;
    }
    console.log(games[roomId]);
    players = games[roomId].players;
    if (players % 2 == 0) color = "black";//decides which player gets white
    else color = "white";
    socket.emit('player',{//we are sending all the information to the client side through this event
      playerid,
      players,
      color,
      roomId
    })
  });
    socket.on("move", function (msg) {
      socket.broadcast.emit("move", msg);
    });
    socket.on('play',function(msg){
      socket.broadcast.emit('play',msg);
      console.log(msg);
    });
  //disconnection
  socket.on("disconnect", function () {
    for(let i=0;i<100;i++){
      if(games[i].pid[0]==playerid||games[i].pid[1]==playerid)
      games[i].players--;
    }
    console.log(playerid + "Disconnected"); 
  });
});
server.listen(port, function () {
  console.log("Listening on port " + port);
});
