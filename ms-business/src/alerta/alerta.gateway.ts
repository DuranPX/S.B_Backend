import {
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';

import { Server } from 'socket.io';


@WebSocketGateway({
  namespace: '/transport',
  cors: {
    origin: '*'
  }
})
export class AlertaGateway {

  @WebSocketServer()
  server: Server;


  emitirAlerta(data: any) {

    this.server
      .to('all')
      .emit(
        data.event_type,
        data
      );

  }

}