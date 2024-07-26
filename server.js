const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let rooms = {};

const questions = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    correct: 0,
  },
  {
    question: "What is the largest lake in the world",
    options: ["Caspian Sea", "Baikal", "Lake Superior", "Ontario"],
    correct: 1,
  },
  {
    question: "What is the capital of Japan?",
    options: ["Beijing", "Tokyo", "Seoul", "Bangkok"],
    correct: 1,
  },
  {
    question: "What is the largest planet in our solar system?",
    options: ["Mars", "Earth", "Jupiter", "Saturn"],
    correct: 2,
  },
  {
    question: "Which river is the longest in the world",
    options: ["Amazon", "Mississippi", "Nile", "Yangtze"],
    correct: 2,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Monet"],
    correct: 1,
  },
  {
    question: "What animal is the national symbol of Australia?",
    options: ["Kangaroo", "Koala", "Emu", "Crocodile"],
    correct: 0,
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3,
  },
  {
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correct: 2,
  },
  {
    question: "What is the speed of light?",
    options: ["300,000 km/s", "150,000 km/s", "200,000 km/s", "250,000 km/s"],
    correct: 0,
  },
];

io.on("connection", (socket) => {
  try {
    console.log("New client connected");

    socket.on("joinLobby", () => {
      socket.emit("updateRooms", rooms);
    });

    socket.on("createRoom", (roomName) => {
      if (!rooms[roomName]) {
        rooms[roomName] = {
          players: [{ id: socket.id, name: "Player 1" }],
          scores: [0, 0],
          questions: questions,
          currentQuestion: 0,
          turn: 0,
        };
        socket.join(roomName);
        socket.emit("roomJoined", roomName);
        io.emit("updateRooms", rooms);
      }
    });

    socket.on("joinRoom", ({ roomName }) => {
      const room = rooms[roomName];
      if (room && room.players.length < 2) {
        room.players.push({ id: socket.id, name: "Player 2" });
        socket.join(roomName);
        socket.emit("roomJoined", roomName);
        io.emit("updateRooms", rooms);
        if (room.players.length === 2) {
          io.to(roomName).emit("startGame", room);
        }
      }
    });

    socket.on("submitAnswer", ({ roomName, answerIndex }) => {
      const room = rooms[roomName];
      if (!room) return;

      const currentQuestion = room.questions[room.currentQuestion];
      if (answerIndex === currentQuestion.correct) {
        room.scores[room.turn] += 10;
      }

      room.turn = (room.turn + 1) % 2;

      // show the question until all the question have been answered
      if (room.currentQuestion < room.questions.length - 1) {
        room.currentQuestion++;
        io.to(roomName).emit("nextQuestion", {
          question: room.questions[room.currentQuestion].question,
          options: room.questions[room.currentQuestion].options,
          turn: room.turn,
        });
      } else {
        io.to(roomName).emit("endGame", room.scores);
        delete rooms[roomName];
        io.emit("updateRooms", rooms);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  } catch (error) {
    console.log(error);
  }
});

server.listen(4000, () => console.log("Server running on port 4000"));
