export const environment = {
  production: true
};

export const constraints={
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]

}
//export const WEB_SOCKET_END="wss://ec2-54-175-14-231.compute-1.amazonaws.com:8080/socket"
export const WEB_SOCKET_END="ws://ec2-54-82-9-222.compute-1.amazonaws.com:8080/socket"
