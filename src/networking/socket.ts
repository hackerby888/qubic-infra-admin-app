import { API_SERVER } from "@/consts/api-server";
import { io } from "socket.io-client";

const socket = io(API_SERVER, {
    autoConnect: true,
});

socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
});

export default socket;
