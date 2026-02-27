"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const gameControllers_1 = require("./controllers/gameControllers");
const db_1 = __importDefault(require("./config/db"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
(0, db_1.default)();
const origins = [
    "http://localhost:4000",
    "http://localhost:5173"
];
if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
}
const io = new socket_io_1.Server(server, {
    cors: {
        origin: origins,
        methods: ["GET", "POST"],
        credentials: true
    },
});
io.on('connection', (socket) => {
    console.log("User connected", socket.id);
    socket.on('create-or-join', (0, gameControllers_1.roomCreation)(socket, io));
    socket.on('roll-dice', (0, gameControllers_1.rollDice)(socket, io));
    socket.on('piece-moved', (0, gameControllers_1.peiceMoved)(socket, io));
    socket.on("disconnect", (0, gameControllers_1.handleDisconnect)(socket, io));
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
