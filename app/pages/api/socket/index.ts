import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";

import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import type { Server as IOServer } from "socket.io";

interface ISocketServer extends HTTPServer {
  io?: IOServer | undefined;
}
interface ISocketWithIO extends NetSocket {
  server: ISocketServer;
}
interface INextApiResponseWithSocket extends NextApiResponse {
  socket: ISocketWithIO;
}

const socket = (_req: NextApiRequest, res: INextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);

    io.on("connection", (socket) => {
      // add shift volunteer
      socket.on("req-shift-volunteer-add", (data) => {
        socket.broadcast.emit("res-shift-volunteer-add", data);
      });
      // toggle check in
      socket.on("req-check-in-toggle", (data) => {
        socket.broadcast.emit("res-check-in-toggle", data);
      });
      // remove shift volunteer
      socket.on("req-shift-volunteer-remove", (data) => {
        socket.broadcast.emit("res-shift-volunteer-remove", data);
      });
      // draw start
      socket.on("req-draw-start", (data) => {
        socket.broadcast.emit("res-draw-start", data);
      });
      // draw move
      socket.on("req-draw-move", (data) => {
        socket.broadcast.emit("res-draw-move", data);
      });
      // clear canvas
      socket.on("req-canvas-clear", (data) => {
        socket.broadcast.emit("res-canvas-clear", data);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default socket;
