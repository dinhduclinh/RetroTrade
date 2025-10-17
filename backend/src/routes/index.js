const userAuthRouter = require("../routes/auth/auth.router");

const categoryRouter = require("./products/category.routes");
const productRouter = require("./products/product.routes")
const conditionsRouter = require("./products/conditions.routes");
const priceUnitsRouter = require("./products/priceUnits.routes");

const uploadproductRouter = require("./products/upload/upload.routes");

const userRouter = require("../routes/user/user.controller")
const blogRoutes = require("../routes/blog/post.routes");

module.exports = (app) => {
    const api = "/api/v1";
    app.use(api + "/auth", userAuthRouter);
    app.use(api + "/user", userRouter);



    app.use(api + "/categories", categoryRouter);
    app.use(api + "/products", productRouter);
    app.use(api + "/products/upload", uploadproductRouter);
    app.use(api + "/conditions", conditionsRouter);
    app.use(api + "/price-units", priceUnitsRouter);
    
    
    app.use(api + "/post", blogRoutes);
}
