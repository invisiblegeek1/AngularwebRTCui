import { Injectable } from '@angular/core';
import { constraints } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PeerServiceService {
  public peer:any;

  constructor() { }

  getNewPeer(){
    this.peer = new RTCPeerConnection(constraints);
    return this.peer

  }






}
