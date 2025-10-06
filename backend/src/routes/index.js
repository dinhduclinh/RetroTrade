const userAuthRouter = require("../routes/auth/auth.router");
// const userProfileRouter = require("../routes/auth/profile.router")

const userRouter = require("../routes/user/user.controller")

module.exports = (app) => {
    const api = "/api/v1";
    app.use(api + "/auth", userAuthRouter);
    // app.use(api + "profile/", userProfileRouter);
    app.use(api + "/user", userRouter);
}
