const socket = io("localhost:3000");

socket.on("connect", () => {
  console.log("successfully connected to wss server");
  console.log(socket.id);
});
