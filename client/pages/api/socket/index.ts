import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";

import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import type { Server as IOServer } from "socket.io";

import {
  ADD_SHIFT_VOLUNTEER_REQ,
  ADD_SHIFT_VOLUNTEER_RES,
  CLEAR_CANVAS_REQ,
  CLEAR_CANVAS_RES,
  DRAW_MOVE_REQ,
  DRAW_MOVE_RES,
  REMOVE_SHIFT_VOLUNTEER_REQ,
  REMOVE_SHIFT_VOLUNTEER_RES,
  TOGGLE_CHECK_IN_REQ,
  TOGGLE_CHECK_IN_RES,
  UPDATE_REVIEW_REQ,
  UPDATE_REVIEW_RES,
} from "@/constants";

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
      socket.on(ADD_SHIFT_VOLUNTEER_REQ, (data) => {
        socket.broadcast.emit(ADD_SHIFT_VOLUNTEER_RES, data);
      });
      // clear canvas
      socket.on(CLEAR_CANVAS_REQ, (data) => {
        socket.broadcast.emit(CLEAR_CANVAS_RES, data);
      });
      // draw move
      socket.on(DRAW_MOVE_REQ, (data) => {
        socket.broadcast.emit(DRAW_MOVE_RES, data);
      });
      // remove shift volunteer
      socket.on(REMOVE_SHIFT_VOLUNTEER_REQ, (data) => {
        socket.broadcast.emit(REMOVE_SHIFT_VOLUNTEER_RES, data);
      });
      // toggle check in
      socket.on(TOGGLE_CHECK_IN_REQ, (data) => {
        socket.broadcast.emit(TOGGLE_CHECK_IN_RES, data);
      });
      // update shift volunteer review
      socket.on(UPDATE_REVIEW_REQ, (data) => {
        socket.broadcast.emit(UPDATE_REVIEW_RES, data);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default socket;
