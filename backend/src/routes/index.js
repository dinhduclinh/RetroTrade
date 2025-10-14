const userAuthRouter = require("../routes/auth/auth.router");

const userRouter = require("../routes/user/user.controller");

const categoryRouter = require("../routes/products/category.router");
const productRouter = require("../routes/products/product.router")
const conditionsRouter = require("../routes/products/conditions.router");
const priceUnitsRouter = require("../routes/products/priceUnits.router");

const uploadproductRouter = require("../routes/products/upload.router");

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
