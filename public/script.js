const socket = io();

let timerInterval;

socket.on("connect", () => {
  clearInterval(timerInterval);
  socket.emit("joinLobby");
});

socket.on("updateRooms", (rooms) => {
  const roomsDiv = document.getElementById("rooms");
  roomsDiv.innerHTML = "";
  rooms.forEach((room) => {
    const roomElement = document.createElement("button");
    roomElement.className = "room-button";
    roomElement.innerText = room.name;
    roomElement.onclick = () => joinRoom(room.name);
    roomsDiv.appendChild(roomElement);
  });
});

socket.on("roomJoined", (roomName) => {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("roomTitle").innerText = `Room: ${roomName}`;
});

socket.on("startGame", ({ room, turn, roomName, questionLeft }) => {
  displayPlayerNames(room);
  displayQuestion(
    room.questions[room.currentQuestion],
    turn,
    roomName,
    questionLeft
  );
});

socket.on(
  "nextQuestion",
  ({ question, options, turn, roomName, questionLeft }) => {
    displayQuestion({ question, options }, turn, roomName, questionLeft);
  }
);

socket.on("endGame", ({ scores, player1, player2, winner }) => {
  clearInterval(timerInterval);

  document.getElementById("question").innerHTML = `<b>Game Over!</b>`;
  document.getElementById("answers").innerHTML = `
    Final Scores:<br>
    ${player1}: ${scores[0]}<br>
    ${player2}: ${scores[1]}<br><br>
    <b>Winner:</b> ${winner}
  `;
  document.getElementById("playerNames").style.display = "none";
  document.getElementById("instructionlabel").style.display = "none";
  document.getElementById("questionleft").style.display = "none";
  document.getElementById("yourTurn").style.display = "none";
  document.getElementById("timer").style.display = "none";

  setTimeout(() => {
    leaveRoom();
  }, 4000);
});

socket.on("error", (message) => {
  alert(message);
});

socket.on("reset", (message) => {
  alert(message);
  resetGame();
});

function displayPlayerNames(room) {
  const playerNamesDiv = document.getElementById("playerNames");
  playerNamesDiv.innerHTML = `${room.players.player1} vs ${room.players.player2}`;
}

async function createRoom() {
  let player1;
  const roomName = document.getElementById("roomName").value;
  player1 = prompt("Please enter player 1 name:");
  if (player1 === null || player1 === "") {
    player1 = "PLAYER 1";
  }
  socket.emit("createRoom", { roomName, player1 });
}

function joinRoom(roomName) {
  let player2;
  player2 = prompt("Please enter player 2 name:");
  if (player2 === null || player2 === "") {
    player2 = "PLAYER 2";
  }
  socket.emit("joinRoom", { roomName, player2 });
}

function displayQuestion(questionData, turn, roomName, questionLeft) {
  document.getElementById("timer").style.display = "block";
  document.getElementById(
    "questionleft"
  ).innerText = `Questions Left: ${questionLeft}`;
  const questionDiv = document.getElementById("question");
  questionDiv.innerText = questionData.question;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  const isCurrentPlayerTurn = socket.id === turn;

  questionData.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.innerText = option;
    button.onclick = () => submitAnswer(roomName, index, turn);
    button.disabled = !isCurrentPlayerTurn;
    button.classList.add(isCurrentPlayerTurn ? "fade-in" : "fade-out");
    answersDiv.appendChild(button);
  });

  const yourTurnDiv = document.getElementById("yourTurn");
  yourTurnDiv.style.display = isCurrentPlayerTurn ? "block" : "none";

  startTimer(roomName, turn);
}

function startTimer(roomName, turn) {
  const timerDiv = document.getElementById("timer");
  let timeLeft = 10;

  timerDiv.innerText = `Time left: ${timeLeft}s`;

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    timerDiv.innerText = `Time left: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      socket.emit("submitAnswer", { roomName, answerIndex: -1, turn });
    }
  }, 1000);
}

function submitAnswer(roomName, answerIndex, turn) {
  const buttons = document
    .getElementById("answers")
    .getElementsByTagName("button");
  for (let button of buttons) {
    button.disabled = true;
  }

  clearInterval(timerInterval);

  socket.emit("submitAnswer", { roomName, answerIndex, turn });
}

function leaveRoom() {
  const roomName = document.getElementById("roomTitle").innerText.split(" ")[1];
  socket.emit("leaveRoom", { roomName });
  resetGame();
}

function resetGame() {
  currentRoom = "";
  document.getElementById("game").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("question").innerText = "";
  document.getElementById("answers").innerHTML = "";
  document.getElementById("playerNames").innerText = "";
  document.getElementById("roomTitle").innerText = "";
  document.getElementById("yourTurn").style.display = "none";
  document.getElementById("timer").innerText = "";
  document.getElementById("questionleft").innerText = "";
  // document.getElementById("timer").style.display = "block";
  clearInterval(timerInterval);
}
