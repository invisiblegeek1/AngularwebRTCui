import { Component, OnInit,Input,ViewChild ,ElementRef} from '@angular/core';
import { Message } from '../Message';
import { WebSocketService } from '../web-socket.service';
import { constraints } from 'src/environments/environment';
import { PeerServiceService } from '../peer-service.service';

const mediaConstraints={
  video:true,
  audio:true
}

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
}
@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})


export class LandingPageComponent implements OnInit {
  @ViewChild('Local') localVideo!: ElementRef;
  @ViewChild('Remote') remoteVideo!: ElementRef;
  @ViewChild('user') text!: ElementRef;
  @ViewChild('file') fileInput!: ElementRef;

  private peer!: RTCPeerConnection;

  private localStream!: MediaStream;
  



  inCall = false;
  localVideoActive = false;
  public dataChannel!:RTCDataChannel;
  public fileChannel!:RTCDataChannel;

  constructor(private socket:WebSocketService,private peerService:PeerServiceService ) { }

  ngOnInit(): void {

  }

  async call(): Promise<void> {
    this.createPeerConnection();

    // Add the tracks from the local stream to the RTCPeerConnection
    this.localStream.getTracks().forEach(
      track => this.peer.addTrack(track, this.localStream)
    );

    try {
      const offer: RTCSessionDescriptionInit = await this.peer.createOffer(offerOptions);
      // Establish the offer as the local peer's current description.
      await this.peer.setLocalDescription(offer);

      this.inCall = true;

      this.socket.sendData({type: 'offer', data: offer});
    } catch (err:any) {
      this.handleGetUserMediaError(err);
    }
  }

  hangUp(): void {
    this.socket.sendData({type: 'hangup', data: ''});
    this.closeVideoCall();
  }

  ngAfterViewInit(): void {
    this.addIncominMessageHandler();
    //this.requestMediaDevices();
  }

  private addIncominMessageHandler(): void {
    this.socket.connectSocket();

    // this.transactions$.subscribe();
    this.socket.messages$.subscribe(
      msg => {
        // console.log('Received message: ' + msg.type);
        switch (msg.type) {
          case 'offer':
            this.handleOfferMessage(msg.data);
            break;
          case 'answer':
            this.handleAnswerMessage(msg.data);
            break;
          case 'hangup':
            this.handleHangupMessage(msg);
            break;
          case 'ice-candidate':
            this.handleICECandidateMessage(msg.data);
            break;
          default:
            console.log('unknown message of type ' + msg.type);
        }
      },
      error => console.log(error)
    );
  }

  //--------------------------------------------------------------------------------------------------------------
  //                      Socket message handler
  //--------------------------------------------------------------------------------------------------------------

  private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming offer');
    if (!this.peer) {
      this.createPeerConnection();
    }

    if (!this.localStream) {
      this.startLocalVideo();
    }

    this.peer.setRemoteDescription(new RTCSessionDescription(msg))
      .then(() => {

        // add media stream to local video
        this.localVideo.nativeElement.srcObject = this.localStream;

        // add media tracks to remote connection
        this.localStream.getTracks().forEach(
          track => this.peer.addTrack(track, this.localStream)
        );

      }).then(() => {

      // Build SDP for answer message
      return this.peer.createAnswer();

    }).then((answer:any) => {

      // Set local SDP
      return this.peer.setLocalDescription(answer);

    }).then(() => {

      // Send local SDP to remote party
      this.socket.sendData({type: 'answer', data: this.peer.localDescription});

      this.inCall = true;

    }).catch(this.handleGetUserMediaError);
  }
  
  private handleAnswerMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming answer');
    this.peer.setRemoteDescription(msg);
  }
  

  private handleHangupMessage(msg: Message): void {
    console.log(msg);
    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg: RTCIceCandidate): void {
    const candidate = new RTCIceCandidate(msg);
    this.peer.addIceCandidate(candidate).catch(this.reportError);
  }

  private async requestMediaDevices(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      // pause all tracks
      this.pauseLocalVideo();
    } catch (e:any) {
      console.error(e);
      alert(`getUserMedia() error: ${e.name}`);
    }
  }


  startLocalVideo(): void {
    this.requestMediaDevices().then(()=>{

      console.log('starting local stream');
      this.localStream.getTracks().forEach(track => {
        track.enabled = true;
      });
      this.localVideo.nativeElement.srcObject = this.localStream;
  
      this.localVideoActive = true;
    })
  }

  pauseLocalVideo(): void {
    console.log('pause local stream');
    this.localStream.getTracks().forEach(track => {
      track.enabled = false;
    });
    this.localVideo.nativeElement.srcObject = undefined;

    this.localVideoActive = false;
  }
  //------------------------------------------------------------------------------------------------------------
  //                 peer
  //-------------------------------------------------------------------------------------------------------

  private createPeerConnection(): void {
    console.log('creating PeerConnection...');
    //this.peer = new RTCPeerConnection(constraints);
    this.peer = this.peerService.getNewPeer();
    this.dataChannel = this.peer.createDataChannel("dataChannel");
    
    
    // this.fileChannel=this.peer.createDataChannel("filechannel");
    // this.fileChannel.binaryType='arraybuffer'
    // this.fileChannel.onopen=(event:any)=>{
    //   this.fileChannel.send("file channel opend")
      
    // }
    this.dataChannel.onopen = (event:any)=> {
      this.dataChannel.send('Hi you!');
    }
    this.dataChannel.onmessage = (event) =>{
      console.log(event.data);
    }
    this.dataChannel.onclose = (event) =>{
      console.log(event);
    }
    this.peer.ondatachannel = function(event) {
      //console.log(event);

      
      
      var channel = event.channel;
      if(channel.label=="filechannel"){

        channel.binaryType = 'arraybuffer';
        channel.onopen=(event:any)=>{
          channel.send("file channnel created")

        }
        channel.onmessage=(event:any)=>{
          console.log(event.data);
          try {
            const blob = new Blob([event.data]);
            console.log(blob);
            
            
            channel.close();
          } catch (err) {
            console.log('File transfer failed');
          }

          
        }

      }

        channel.onopen = function(event) {
        channel.send('Hi back!');
      }
      channel.onmessage = function(event) {
        console.log(event.data);
        
      }
    }

    this.peer.onicecandidate = this.handleICECandidateEvent;
    this.peer.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.peer.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peer.ontrack = this.handleTrackEvent;
  }

  private closeVideoCall(): void {
    console.log('Closing call');

    if (this.peer) {
      console.log('--> Closing the peer connection');

      this.peer.ontrack = null;
      this.peer.onicecandidate = null;
      this.peer.oniceconnectionstatechange = null;
      this.peer.onsignalingstatechange = null;

      // Stop all transceivers on the connection
      this.peer.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      // Close the peer connection
      this.peer.close();
     // this.peer = null;

      this.inCall = false;
    }
  }

  //----------------------------------------------------------------------------------------------------------------------------------
  //                         data channnel
  //--------------------------------------------------------------------------------------------------------------------------------------

  sendToPeer=async(text:string)=>{
    this.dataChannel = this.peer.createDataChannel("dataChannel");
    this.dataChannel.onopen=async()=>{

      this.dataChannel.send(text);
    }
    
  }

  sendFile=(event:any)=>{
    // console.log(event.target.files[0]);
    this.fileChannel=this.peer.createDataChannel("filechannel");
    this.fileChannel.binaryType='arraybuffer'
    this.fileChannel.onopen=(event:any)=>{
      this.fileChannel.send("file channel opend")
      
    }
  this.fileChannel.onopen=async()=>{

    const arrayBuffer =await event.target.files[0].arrayBuffer();
    this.fileChannel.send(arrayBuffer);
    console.log("file transfered");
    

  }
  

    

    

    
  }





//----------------------------------------------------------------------------------------------
//                       Error handler
//--------------------------------------------------------------------------------------------------------
  private handleGetUserMediaError(e: Error): void {
    switch (e.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        console.log(e);
        alert('Error opening your camera and/or microphone: ' + e.message);
        break;
    }

    this.closeVideoCall();
  }

  private reportError = (e: Error) => {
    console.log('got Error: ' + e.name);
    console.log(e);
  }

  //----------------------------------------------------------------------------------------------------------------
  //                                Event Handler
  //--------------------------------------------------------------------------------------------------------------------------

  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    console.log(event);
    if (event.candidate) {
      this.socket.sendData({
        type: 'ice-candidate',
        data: event.candidate
      });
    }
  }

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peer.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peer.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log(event);
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }

  //--------------------------------------------------------------------------------------------------
  //                          peer functions
  //--------------------------------------------------------------------------------------------------

  


}
