import { createJsonSocket } from '../framework/websocket.js'

const socket = createJsonSocket()

export const connect = socket.connect
export const send = socket.send
