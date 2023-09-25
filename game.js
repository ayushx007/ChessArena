game = new Chess(); //creates a new game using chess.js library
var socket = io(); //initialises socket
var color = "white";
var players; //specifies no of players in current room
var roomId; //room id between 0 and 99
var play = true; //while this is true, a new player can join, once two players have joined, we will change this to false so another player cannot join
//for DOM manipulation:
var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";
var room = document.getElementById("room");
var roomNumber = document.getElementById("roomNumbers");
var button = document.getElementById("button");
var state = document.getElementById("state");

var connect = function () {
  // extract the value of the input field
  roomId = room.value;
  // if the room number is valid
  if (roomId !== "" && parseInt(roomId) <= 100) {
    room.remove();
    roomNumber.innerHTML = "Room Number " + roomId;
    button.remove();

    // emit the 'joined' event which we have set up a listener for on the server
    socket.emit("joined", roomId);
  }
};
socket.on("full", function (msg) {
  if (roomId == msg) window.location.assign(window.location.href + "full.html");
});
socket.on("play", function (msg) {
  if (msg == roomId) {
    play = false;
    state.innerHTML = "Game in progress";
  }
});
socket.on("move", function (msg) {
  if (msg.room == roomId) {
    game.move(msg.move);
    board.position(game.fen());
    console.log("moved");
  }
});
var removeGreySquares = function () {
  $("#board .square-55d63").css("background", "");
};

var greySquare = function (square) {
  var squareEl = $("#board .square-" + square);

  var background = "#a9a9a9";
  if (squareEl.hasClass("black-3c85d") === true) {
    background = "#696969";
  }

  squareEl.css("background", background);
};

var onDragStart = function (source, piece) {
  if (
    game.game_over() === true ||
    play ||
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1) ||
    (game.turn() === "w" && color === "black") ||
    (game.turn() === "b" && color === "white")
  ) {
    return false;
  }
};

var onDrop = function (source, target) {
  removeGreySquares();

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: "q",
  });
  if (game.game_over()) {
    state.innerHTML = "GAME OVER";
    socket.emit("gameOver", roomId);
  }

  // illegal move
  if (move === null) return "snapback";
  // if the move is allowed, emit the move event.
  else
    socket.emit("move", {
      move: move,
      board: game.fen(),
      room: roomId,
    });
};

var onMouseoverSquare = function (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
      square: square,
      verbose: true
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to);
  }
};

var onMouseoutSquare = function (square, piece) {
  removeGreySquares();
};

var onSnapEnd = function () {
  board.position(game.fen());
};

socket.on("player", (msg) => {
  var plno = document.getElementById("player");

  // we're passing an object -
  // { playerId, players, color, roomId } as msg
  color = msg.color;

  // show the players number and color in the player div
  players = msg.players;
  plno.innerHTML = "Player " + players + " : " + color;

  // emit the play event when 2 players have joined
  if (players == 2) {
    play = false;
    // relay it to the other player that is in the room
    socket.emit("play", msg.roomId);
    // change the state from 'join room' to -
    state.innerHTML = "Game in Progress";
  }
  // if only one person is in the room
  else state.innerHTML = "Waiting for Second player";

  var cfg = {
    orientation: color,
    draggable: true,
    position: "start",
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
  };
  board = ChessBoard("board", cfg);
});
var board;
