
const ws = require("ws");

let password = "repcomm";
let title = "untitled stream";
let desc = "unused description";

let server = new ws.Server({
    port:5001,
});

let streamer = undefined;

let broadcast = (data, includeStreamer=false)=>{
    server.clients.forEach((socket)=>{
        if (socket.readyState === WebSocket.OPEN) {
            if (socket === streamer && !includeStreamer) {
                return; //Skip this one
            }
            socket.send(data);
        }
    });
}

let onData = (socket, data)=>{
    let json = JSON.parse(data);
    console.log("Client sent", json);

    if (streamer === socket) {

    } else {
        if (json.listening === true) {
            console.log("Sending details");
            socket.send(JSON.stringify({
                title:title,
                desc:desc
            }));
        }
    }
}

server.on("connection", (socket)=>{
    console.log("Socket connection");
    socket.on("message", (data)=>onData(socket, data));
});

server.on("listening", ()=>{
    console.log("Server listening now");
});
