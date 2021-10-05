import { Component, OnInit } from '@angular/core';
import { Message } from '../Message';
import { PeerServiceService } from '../peer-service.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {

  public initial=-1;

  public messageList:Array<Message>=[{type:"sender",data:"hello"}];

  constructor(private peerService:PeerServiceService) {
    //this.getMessageList();
    
    
   }

  ngOnInit(): void {
    PeerServiceService.messageslist.subscribe((msg)=>{
      console.log(msg);

      // Object.assign(this.messageList,msg);
      this.messageList.push(msg);
      this.initial=this.messageList.length-1;
      

      //this.messageList=[...this.messageList,msg];
    })
    
  }

  ngAfterViewInit(){
    
    

  }

  getMessageList(){
    PeerServiceService.messageslist.subscribe((msg)=>{
      console.log(msg);

      // Object.assign(this.messageList,msg);
      this.messageList.push(msg);
      

      //this.messageList=[...this.messageList,msg];
    })
    
    console.log(this.messageList);
    

  }



}
