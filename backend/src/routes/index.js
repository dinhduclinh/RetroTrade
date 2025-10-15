const userAuthRouter = require("../routes/auth/auth.router");

const userRouter = require("../routes/user/user.controller")
const blogRoutes = require("../routes/blog/post.routes");

module.exports = (app) => {
    const api = "/api/v1";
    app.use(api + "/auth", userAuthRouter);
    app.use(api + "/user", userRouter);
    app.use(api + "/post", blogRoutes);
}
