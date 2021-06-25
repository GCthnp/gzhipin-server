const { ChatModel } = require("../db/models")
module.exports = function (server) {
 // 得到 IO 对象 

 const io = require("socket.io")(server, { cors: true })

 // 监视连接(当有一个客户连接上时回调) 
 io.on('connection', function (socket) {
  console.log('soketio connected')
  // 绑定 sendMsg 监听, 接收客户端发送的消息 
  socket.on('sendMsg', function ({ from, to, context }) {

   const chat_id = [from, to].sort().join("_")
   const create_time = Date.now()
   console.log(typeof create_time);
   
   new ChatModel({ from, to, chat_id, context, create_time }).save(function (err, chatMsg) {
    // 向客户端发消息
    io.emit('receiveMsg', {...chatMsg});
    // io.emit('receiveMsg',chatMsg)
    console.log('向所有连接的客户端发送消息', chatMsg)
   })
  })
 })
}