# Multiplayer Quiz Game

## Screenshots

<p align="center">
   <img src="screenshots/game.png" width="1000">
</p>

## Description

This project is a multiplayer quiz game built using Express, Socket.IO, Postgres Sequelize, HTML, and JavaScript. The game allows players to join a lobby, create or join rooms, and answer quiz questions in a competitive format.

## Features

- Create and join quiz rooms
- Store Room Data in DB
- Real-time gameplay with Socket.IO
- Scoring system
- Game timer
- Basic player management

## Project Structure

```bash
/project-root
|-- /db
|   |-- Room.model.js
|-- /public
|   |-- index.html
|   |-- script.js
|   |-- style.css
|-- server.js
|-- README.md
|-- package.json
|-- package-lock.json
```

## Installation

### Prerequisites

- Node.js
- PostgresSQL
- npm

### Steps

1. Clone the repository:

   ```sh
   git clone https://github.com/hassanrazeen/quiz-mulitplayer-game.git

   ```

2. Navigate to the project directory:

   ```sh
   cd quiz-mulitplayer-game

   ```

3. Install the dependencies:

   ```sh
   npm ci

   ```

4. Update the database credentials:
   
   Before starting the server, make sure to update the database credentials in the .env file with your local database configuration

   For example:
   ```sh
   DB_NAME="quiz-game-db"
   DB_HOST="localhost"
   DB_PASSWORD="Password"
   DB_USER_NAME="postgres"
   ```
   

6. Start the server:
   ```sh
   node server.js
   ```

## Usage

### Creating a Room

1. Enter a room name and click "Create Room".
2. Enter the name of Player 1 when prompted.

### Joining a Room

1. Click on a room name from the available rooms list.
2. Enter the name of Player 2 when prompted.

### Playing the Game

1. Answer the questions displayed by clicking on the options.
2. The player with the most correct answers at the end of the game wins.
