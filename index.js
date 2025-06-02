// const express = require("express");
// const http = require("http");
// const app = express();
// const PORT = process.env.PORT || 4000;
// const server = http.createServer(app);
// const io = require("socket.io")(server);

// app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/public/index.html");
// });

// app.get("/hello", (req, res) => {
//   res.send("hello");
// });

// let connectedPeers = [];

// io.on("connection", (socket) => {
//   connectedPeers.push(socket.id);
//   console.log(socket.id + " connected to socket server");

//   socket.on("disconnect", () => {
//     console.log("user disconnected from socket server");

//     const newConnectedPeers = connectedPeers.filter((peersSocketId) => {
//       return peersSocketId !== socket.id;
//     });
//     connectedPeers = newConnectedPeers;
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors()); // this handles CORS for your express routes

app.use(express.static("public"));

app.get("/hello", (req, res) => {
  res.send("hello");
});

let connectedPeers = [];

io.on("connection", (socket) => {
  connectedPeers.push(socket.id);
  console.log(socket.id + " connected to socket server");
  const instantSocketId = socket.id;

  socket.on("pre-offer", (data) => {
    console.log("preooffer received from callee");
    const { callType, calleePersonalCode } = data;
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === calleePersonalCode
    );
    console.log("connectedPeer: ", connectedPeer);
    if (connectedPeer) {
      const data = {
        callType: callType,
        callerSocketId: instantSocketId,
      };
      console.log(data);
      io.to(calleePersonalCode).emit("pre-offer", data);
    } else {
      io.to(socket.id).emit("pre-offer", {
        callType: "not-found",
        callerSocketId: socket.id,
      });
    }

    // console.log("pre-offer emitted to callee");
  });

  socket.on("pre-offer-answer", (data) => {
    console.log("pre-offer answer received from callee");
    const { preOfferAnswer, callerSocketId } = data;
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === callerSocketId
    );
    if (connectedPeer) {
      io.to(callerSocketId).emit("pre-offer-answer", {
        preOfferAnswer: preOfferAnswer,
        calleeSocketId: instantSocketId,
      });
    } else {
      io.to(callerSocketId).emit("pre-offer-answer", {
        preOfferAnswer: "callee-not-found",
        calleeSocketId: instantSocketId,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(socket.id + " disconnected from socket server");
    connectedPeers = connectedPeers.filter((id) => id !== socket.id);
  });

  socket.on("webRTC-signaling", (data) => {
    const { connectedUserSocketId } = data;
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );
    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("webRTC-signaling", data);
    } else {
      console.log("Connected peer not found for signaling");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
