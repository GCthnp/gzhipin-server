var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5')

const { UserModel, ChatModel } = require('../db/models')

const filter = { password: 0 }; // 查询时过滤出指定的属性   2021/5/16没用

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// 注册的路由
router.post('/register', (req, res) => {
  const { username, password, type } = req.body
  // 实例查找返回对象，为匹配返回null, filter为过滤不需要返回的参数
  UserModel.findOne({ username }, filter, (err, user) => {
    if (user) {
      res.send({ code: 1, msg: '用户名存在' })
    } else {
      // 使用md5 进行加密
      const userModel = new UserModel({ username, type, password: md5(password) })

      userModel.save(function (err, user) {
        const data = { username, type: user.type, _id: user._id }
        // 持久化 cookie, 浏 览器会保存在本地文件 生成一个cookie
        res.cookie('userid', user._id, { maxAge: 1000 * 60 * 60 * 24 * 7 })
        res.send({ code: 0, data })
      })
    }
  })
})
// 登录的路由
router.post('/login', (req, res) => {
  const { username, password } = req.body
  UserModel.findOne({ username }, (err, user) => {
    if (!user) return res.send({ code: 1, msg: '用户不存在' });

    if (md5(password) !== user.password) return res.send({ code: 1, msg: '密码错误' });

    // 持久化 cookie, 浏 览器会保存在本地文件 生成一个cookie
    res.cookie('userid', user._id, { maxAge: 1000 * 60 * 60 * 24 * 7 })
    //创建一个心得数据，返回的值不携带password
    const data = { username, type: user.type, _id: user._id }
    res.send({ code: 0, data })
  })
})
// 更新信息路由
router.post('/updata', (req, res) => {
  //从请求的cookie中得到userid
  const userid = req.cookies.userid
  if (!userid) return res.send({ code: 1, msg: '请先登录' })
  const userInfo = req.body
  UserModel.findByIdAndUpdate({ _id: userid }, userInfo, (err, oldUser) => {
    // 如有有cookes的userid，但是没有找到匹配的
    if (!oldUser) {
      // 清除浏览器中的userid
      res.clearCookie("userid")
      res.send({ code: 1, msg: '请先登录' });
    } else {
      const { username, _id, type } = oldUser
      const data = Object.assign({ username, _id, type }, userInfo)
      res.send({ code: 0, data })
    }
  })
})

// 查找用户
router.get('/user', (req, res) => {
  //从请求的cookie中得到userid
  const userid = req.cookies.userid
  if (!userid) return res.send({ code: 1, msg: '请先登录' })

  UserModel.findOne({ _id: userid }, filter, (err, user) => {
    if (!user) {
      // 清除浏览器中的userid
      res.clearCookie("userid")
      res.send({ code: 1, msg: '请先登录' });
    } else {
      // const data = Object.assign({ username, _id, type }, userInfo)
      res.send({ code: 0, data: user })
    }
  })
})
// 查找用户列表
router.get('/list', function (req, res) {
  const { type } = req.query
  UserModel.find({ type }, filter, function (err, users) {
    return res.json({ code: 0, data: users })
  })
})

/*获取当前用户所有相关聊天信息列表 */
router.get('/msglist', function (req, res) {
  // 获取 cookie 中的 userid 
  const userid = req.cookies.userid
  // 查询得到所有 user 文档数组 
  UserModel.find(function (err, userDocs) {
    // 用对象存储所有 user 信息: key 为 user 的_id, val 为 name 和 header 组成的 user 对象 
    const users = {}
    // 对象容器 
    userDocs.forEach(doc => {
      users[doc._id] = { username: doc.username, header: doc.header }
    })
    /*查询 userid 相关的所有聊天信息 参数 1: 查询条件 参数 2: 过滤条件 参数 3: 回调函数 */
    ChatModel.find({ '$or': [{ from: userid }, { to: userid }] }, filter, function (err, chatMsgs) {
      // 返回包含所有用户和当前用户相关的所有聊天消息的数据 
      res.send({ code: 0, data: { users, chatMsgs } })
    })
  })
})
/*修改指定消息为已读 */
router.post('/readmsg', function (req, res) {
  // 得到请求中的 from 和 to 
  const from = req.body.from
  const to = req.cookies.userid
  /*更新数据库中的 chat 数据 参数 1: 查询条件 参数 2: 更新为指定的数据对象 参数 3: 是否 1 次更新多条, 默认只更新一条 参数 4: 更新完成的回调函数 */
  ChatModel.update({ from, to, read: false }, { read: true }, { multi: true }, function (err, doc) {
    console.log('/readmsg', doc)
    res.send({ code: 0, data: doc.nModified }) // 更新的数量
  })
})


module.exports = router;
