var express = require("express");
var passport = require("passport");
var User = require("../models/user");
var router = express.Router();

router.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
});
// 首页路由------------------------------
router.get("/", function(req, res, next) {
    User.find()
        .sort({ createdAt: "descending" })
        .exec(function(err, users) {
            if (err) { return next(err); }
            res.render("index", { users: users });
            console.log("user", users)
        });
});

// 注册页路由----------------------------
router.get("/signup", function(req, res) {
  res.render("signup");
});

router.post("/signup", function(req, res, next) {
  // 参数解析
  var username = req.body.username;
  var password = req.body.password;

  // 调用findOne只返回一个用户。你想在这匹配一个用户名
  User.findOne({ username: username }, function(err, user) {
      if (err) { return next(err); }
      // 判断用户是否存在
      if (user) {
          req.flash("error", "User already exists");
          return res.redirect("/signup");
      }
      // 新建用户
      var newUser = new User({
          username: username,
          password: password
      });
      // 插入记录
      newUser.save(next);
  });
  // 进行登录操作并实现重定向
}, passport.authenticate("login", {
  successRedirect: "/",
  failureRedirect: "/signup",
  failureFlash: true
}));

router.get("/login", function(req, res) {
  res.render("login");
});

// 用户登录路由
router.post("/login", passport.authenticate("login", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true 
}));

// 用户登出
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

// 用户个人信息路由---------------------------
router.get("/users/:username", function(req, res, next) {
  User.findOne({ username: req.params.username }, function(err, user) {
      if (err) { return next(err); }
      if (!user) { return next(404); }
      res.render("profile", { user: user });
  });
});

// 确保用户被身份认证；如果它们没有被重定向的话则运行你的请求处理
router.get("/edit", ensureAuthenticated, function(req, res) {
  res.render("edit");
});

// 通常，这会是一个PUT请求，不过HTML表单仅仅支持GET和POST
router.post("/edit", ensureAuthenticated, function(req, res, next) {
  req.user.displayName = req.body.displayname;
  req.user.bio = req.body.bio;
  req.user.save(function(err) {
      if (err) {
          next(err);
          return;
      }
      req.flash("info", "Profile updated!");
      res.redirect("/edit");
  });
});

//权限进行检查，如果检查不通过则会重定向到登录页
function ensureAuthenticated(req, res, next) {
  // 一个Passport提供的函数
  if (req.isAuthenticated()) {
      next();
  } else {
      req.flash("info", "You must be logged in to see this page.");
      res.redirect("/login");
  }
}

module.exports = router;