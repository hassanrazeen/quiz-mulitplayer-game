const socket = io("/");
let currentRoom = "";
let players = [];
let timerInterval;
let currentQuestion = 0;

socket.on("connect", () => {
  socket.emit("joinLobby");
});

socket.on("updateRooms", (rooms) => {
  const roomsDiv = document.getElementById("rooms");
  roomsDiv.innerHTML = "";
  for (const roomName in rooms) {
    const room = rooms[roomName];
    if (room.players.length < 2) {
      const roomElement = document.createElement("button");
      roomElement.innerText = roomName;
      roomElement.onclick = () => joinRoom(roomName);
      roomsDiv.appendChild(roomElement);
    }
  }
});

socket.on("roomJoined", (roomName) => {
  currentRoom = roomName;
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
  document.getElementById("roomTitle").innerText = `Room: ${roomName}`;
});

socket.on("startGame", (room) => {
  players = room.players;
  displayPlayerNames();
  displayQuestion(room.questions[room.currentQuestion], room.turn);
});

socket.on("nextQuestion", ({ question, options, turn }) => {
  displayQuestion({ question, options }, turn);
});

socket.on("endGame", (scores) => {
  clearInterval(timerInterval);

  let resultText;
  if (scores[0] > scores[1]) {
    resultText = "Player 1 wins!";
  } else if (scores[0] < scores[1]) {
    resultText = "Player 2 wins!";
  } else {
    resultText = "It's a tie!";
  }

  document.getElementById("question").innerText = `Game Over! ${resultText}`;
  document.getElementById("answers").innerHTML = `
    Final Scores:<br>
    Player 1: ${scores[0]}<br>
    Player 2: ${scores[1]}
  `;

  document.getElementById("yourTurn").style.display = "none";
  document.getElementById("timer").style.display = "none";

  setTimeout(() => {
    resetGame();
  }, 3000);
});

// function to display player names
function displayPlayerNames() {
  const playerNamesDiv = document.getElementById("playerNames");
  playerNamesDiv.innerHTML = players.map((player) => player.name).join(" vs ");
}

// function to create the room
function createRoom() {
  const roomName = document.getElementById("roomName").value;
  socket.emit("createRoom", roomName);
}

// function to join the room
function joinRoom(roomName) {
  console.log("room name: ", roomName);

  socket.emit("joinRoom", { roomName });
}

// function to display questions
function displayQuestion(questionData, turn) {
  const questionDiv = document.getElementById("question");
  questionDiv.innerText = questionData.question;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  const isCurrentPlayerTurn = socket.id === players[turn].id;

  questionData.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.innerText = option;
    button.onclick = () => submitAnswer(index);
    button.disabled = !isCurrentPlayerTurn;
    button.classList.add(isCurrentPlayerTurn ? "fade-in" : "fade-out");
    answersDiv.appendChild(button);
  });

  const yourTurnDiv = document.getElementById("yourTurn");
  yourTurnDiv.style.display = isCurrentPlayerTurn ? "block" : "none";

  startTimer();
}

// function to start the stop watch
function startTimer() {
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
      socket.emit("submitAnswer", { roomName: currentRoom, answerIndex: -1 }); // Indicate no answer was submitted
    }
  }, 1000);
}

// function to submit the answer and disaple the all the buttons
function submitAnswer(answerIndex) {
  const buttons = document
    .getElementById("answers")
    .getElementsByTagName("button");
  for (let button of buttons) {
    button.disabled = true;
  }

  clearInterval(timerInterval);

  socket.emit("submitAnswer", { roomName: currentRoom, answerIndex });
}

// function to reset the game
function resetGame() {
  currentRoom = "";
  document.getElementById("game").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("question").innerText = "";
  document.getElementById("answers").innerHTML = "";
  document.getElementById("scores").innerHTML = "";
  document.getElementById("playerName").innerText = "";
}
