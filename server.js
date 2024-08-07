const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { sequelize, Room } = require("./db/Room.model");
const { Sequelize } = require("sequelize");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

// Sample quiz questions
const questions = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    correct: 0,
  },
  {
    question: "What is the largest lake in the world?",
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
    question: "Which river is the longest in the world?",
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

let room = {};

// Handle new socket connections
io.on("connection", (socket) => {
  try {
    console.log("New client connected");

    // Handle player joining the lobby
    socket.on("joinLobby", async () => {
      // fetch all the rooms which are have only one player
      const rooms = await Room.findAll({ where: { player2: null } });
      socket.emit("updateRooms", rooms);
    });

    // Handle creating a new room
    socket.on("createRoom", async ({ roomName, player1 }) => {
      const isRoomPresent = await Room.findOne({ where: { name: roomName } });
      if (!isRoomPresent) {
        const result = await Room.create({
          name: roomName,
          player1: player1,
          player1_socket_id: socket.id,
        });
        room[roomName] = {
          players: { player1: result.player1, player2: result.player2 },
          scores: [0, 0],
          questions: questions,
          currentQuestion: 0,
          turn: 0,
        };
        const rooms = await Room.findAll({ where: { player2: null } });
        socket.join(roomName);
        socket.emit("roomJoined", roomName);
        io.emit("updateRooms", rooms);
      } else {
        console.log("object");
        socket.emit("error", `Room ${roomName} already exists`);
      }
    });

    // Handle joining an existing room
    socket.on("joinRoom", async ({ roomName, player2 }) => {
      const result = await Room.findOne({ where: { name: roomName } });
      if (!result) {
        io.emit("reset", "Room is no longer available");
      } else {
        if (result.player2 == null) {
          await Room.update(
            { player2, player2_socket_id: socket.id },
            { where: { name: roomName } }
          );
          if (!room[roomName]) {
            room[roomName] = {
              players: { player1: result.player1, player2: player2 },
              scores: [0, 0],
              questions: questions,
              currentQuestion: 0,
              turn: 0,
            };
          } else {
            room[roomName].players.player2 = player2;
          }
          socket.join(roomName);
          socket.emit("roomJoined", roomName);
          const rooms = await Room.findAll({ where: { player2: null } });
          io.emit("updateRooms", rooms);
          const turn =
            room[roomName].turn == 0 ? result.player1_socket_id : socket.id;
          io.to(roomName).emit("startGame", {
            room: room[roomName],
            turn,
            roomName,
            questionLeft: questions.length - room[roomName].currentQuestion,
          });
        }
      }
    });

    // Handle submitting answers
    socket.on("submitAnswer", async ({ roomName, answerIndex, turn }) => {
      let winnerScore = 0;
      let winner = "";

      const result = await Room.findOne({ where: { name: roomName } });
      if (!result) {
        socket.emit("reset", "player disconnected");
      } else {
        const currentQuestion =
          room[roomName].questions[room[roomName].currentQuestion];
        if (answerIndex === currentQuestion.correct) {
          room[roomName].scores[room[roomName].turn] += 10;
        }

        room[roomName].turn = (room[roomName].turn + 1) % 2;

        const nextTurn =
          result.player1_socket_id == turn
            ? result.player2_socket_id
            : result.player1_socket_id;

        if (
          room[roomName].currentQuestion <
          room[roomName].questions.length - 1
        ) {
          room[roomName].currentQuestion++;
          io.to(roomName).emit("nextQuestion", {
            question:
              room[roomName].questions[room[roomName].currentQuestion].question,
            options:
              room[roomName].questions[room[roomName].currentQuestion].options,
            turn: nextTurn,
            roomName: roomName,
            questionLeft: questions.length - room[roomName].currentQuestion,
          });
        } else {
          if (room[roomName].scores[0] > room[roomName].scores[1]) {
            winnerScore = room[roomName].scores[0];
            winner = result.player1;
          } else if (room[roomName].scores[1] > room[roomName].scores[0]) {
            winnerScore = room[roomName].scores[1];
            winner = result.player2;
          } else {
            winner = "It's a tie!";
            winnerScore = room[roomName].scores[1];
          }

          await Room.update(
            { winnerScore, winner },
            { where: { name: roomName } }
          );
          io.to(roomName).emit("endGame", {
            scores: room[roomName].scores,
            player1: result.player1,
            player2: result.player2,
            winner: winner,
          });
          delete room[roomName];
          const rooms = await Room.findAll({ where: { player2: null } });
          io.emit("updateRooms", rooms);
        }
      }
    });

    // Handle leaving a room
    socket.on("leaveRoom", async ({ roomName }) => {
      const result = await Room.findOne({ where: { name: roomName } });
      if (result) {
        if (
          result.player1_socket_id == socket.id ||
          result.player2_socket_id == socket.id
        ) {
          await Room.destroy({ where: { name: roomName } });
          delete room[roomName];
          io.to(roomName).emit("roomDeleted");
          const rooms = await Room.findAll({ where: { player2: null } });
          io.emit("updateRooms", rooms);
        }
      }
      socket.leave(roomName);
    });

    // Handle socket disconnection
    socket.on("disconnect", async () => {
      const playerRoom = await Room.findOne(
        {
          where: {
            [Sequelize.Op.or]: [
              { player1_socket_id: socket.id },
              { player2_socket_id: socket.id },
            ],
          },
        },
        { raw: true }
      );
      if (playerRoom) {
        await Room.destroy({ where: { name: playerRoom.name } });
        delete room[playerRoom.name];
        io.to(playerRoom.name).emit("roomDeleted");
        const rooms = await Room.findAll({ where: { player2: null } });
        io.emit("updateRooms", rooms);
        console.log("Client disconnected");
      }
    });
  } catch (error) {
    console.log("Client disconnected");
  }
});

server.listen(4000, () => {
  sequelize.sync({ alter: true });
  console.log("Server running on port 4000");
});
