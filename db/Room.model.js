require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const { DB_NAME, DB_HOST, DB_PASSWORD, DB_USER_NAME } = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER_NAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "postgres",
  // ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
    },
  },
});

const Room = sequelize.define(
  "Room",
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },
    player1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    player2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    player1_socket_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    player2_socket_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    winner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    winnerScore: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

module.exports = { sequelize, Room };
