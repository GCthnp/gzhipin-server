const md5 = require("blueimp-md5")

// 引入 mongoose
const mongoose = require('mongoose')
// 连接指定数据库(URL 只有数据库是变化的)
mongoose.connect("mongodb://localhost:27017/gzhipin_test2")
// 获取连接对象
const conn = mongoose.connection
// 绑定连接完成的监听(用来提示连接成功)
conn.on('connected',function() {
 console.log("连接成功");
})

// 2. 得到对应特定集合的 Model 
// 2.1. 字义 Schema(描述文档结构)
const userSchema = mongoose.Schema({
 username:{type:String,require:true},
 password:{type: String, required: true},
 type:{type: String, required: true},
})

// 2.2. 定义 Model(与集合对应, 可以操作集合)
var UserModel = mongoose.model('user', userSchema);

// 添加数据
function testSave() {
 const userModel = new UserModel({"username":'jamas',"password":md5('123'),"type":"dashen"})
 userModel.save(function(error,user){
  console.log("save",error,user);
 })
}
// testSave()

// 3.2. 通过 Model 的 find()/findOne()查询多个或一个数据
function testFind() {
 // 查询多个，为数组，没有匹配则为[]
 UserModel.find(function (error,users) {
   console.log("find()",error,users);
 })
 //查询一个：为对象，没有匹配则为null
 UserModel.findOne({_id:'60a08d505ba0ffd4e455bf78'},function(error,user){
  console.log("findOne",error,user);
 })
}
// testFind()


// 3.3. 通过 Model 的 findByIdAndUpdate()更新某个数据
function testUpdata() {
 UserModel.findByIdAndUpdate({_id:'60a08d505ba0ffd4e455bf78'},
 {username:"Jack"},function (error,user) {
  console.log('findByIdAndUpdate()', error, user)
 })
}
// testUpdata()

// 3.4. 通过 Model 的 remove()删除匹配的数据
function testDelete(){
 UserModel.remove({_id:'60a08d505ba0ffd4e455bf78'},function (error,doc) {
   console.log("remove",error,doc);
 })
}
testDelete()