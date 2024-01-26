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
      // check in/out volunteers
      socket.on("req-check-in", (data) => {
        socket.broadcast.emit("res-check-in", data);
      });
      // remove shift volunteer
      socket.on("req-shift-volunteer-remove", (data) => {
        socket.broadcast.emit("res-shift-volunteer-remove", data);
      });
      // create role
      socket.on("req-role-create", (data) => {
        socket.broadcast.emit("res-role-create", data);
      });
      // toggle role display
      socket.on("req-role-display-toggle", (data) => {
        socket.broadcast.emit("res-role-display-toggle", data);
      });
      // delete role
      socket.on("req-role-delete", (data) => {
        socket.broadcast.emit("res-role-delete", data);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default socket;
