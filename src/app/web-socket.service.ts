import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import { WEB_SOCKET_END } from 'src/environments/environment.prod';
//import { WEB_SOCKET_END } from 'src/environments/environment';
import { Message } from './Message';

@Injectable({
  providedIn: 'root'
})


export class WebSocketService {
  
  private socket$!: WebSocketSubject<any>;
  private messagesSubject = new Subject<Message>();
  public messages$ = this.messagesSubject.asObservable();

  constructor() { }


  public connectSocket(): void {

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();

      this.socket$.subscribe(
        // Called whenever there is a message from the server
        msg => {
          console.log('Received message of type: ' + msg.type);
          this.messagesSubject.next(msg);
        }
      );
    }
  }


  sendData(msg: Message): void {
    console.log('sending message: ' + msg.type);
    this.socket$.next(msg);
  }

  
  private getNewWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: WEB_SOCKET_END,
      openObserver: {
        next: () => {
          console.log('[DataService]: socket connected');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[DataService]: socket disconnected');
          //this.socket$ = undefined;
          this.connectSocket();
        }
      }
    });
  }


}
