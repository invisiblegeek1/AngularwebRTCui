import { Injectable } from '@angular/core';
//import { constraints } from 'src/environments/environment';
import { constraints } from 'src/environments/environment.prod';
import {Subject} from 'rxjs'
import { MessagesComponent } from './messages/messages.component';
import {Message} from './Message';






@Injectable({
  providedIn: 'root'
})
export class PeerServiceService {
  public peer:any=null;
  public dataChannel:any;
  public static messages=new Subject<Message>();
  public static messageslist=PeerServiceService.messages.asObservable();

  constructor() { }

  getNewPeer(){
    this.peer = new RTCPeerConnection(constraints);
    return this.peer

  }

  createNewDataChannel(label:string){
    if(this.peer!=null){
      this.dataChannel=this.peer.createDataChannel(label);
      
    }

    return this.dataChannel;

  }

  static addMessages(msg:any){

    this.messages.next(msg);
    console.log(this.messages);
    

  }

  static getMessages(){
    return this.messages;
  }






}
