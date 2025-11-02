const userAuthRouter = require("../routes/auth/auth.router");
const signatureRouter = require("./auth/signature.router");

const categoryRouter = require("./products/category.routes");
const productRouter = require("./products/product.routes")
const conditionsRouter = require("./products/conditions.routes");
const priceUnitsRouter = require("./products/priceUnits.routes");

const uploadproductRouter = require("./products/upload/upload.routes");

const userRouter = require("./user/user.router")
const blogRoutes = require("../routes/blog/post.routes");

const walletRoutes = require("../routes/wallet/wallet.routes");
const messagesRouter = require("../routes/messages/messages.router");
const cartItemRouter = require("./order/cartItem.routes");
const notificationRouter = require("./community/notification.routes");
const ownerRequestUserRouter = require("./user/ownerRequest/ownerRequest.user.router");
const ownerRequestModeratorRouter = require("./user/ownerRequest/ownerRequest.moderator.routes");
const orderRouter = require("./order/order.routes");
const taxRouter = require("./tax/tax.routes");
const auditRouter = require("./audit/audit.routes");
module.exports = (app) => {
    const api = "/api/v1";
    app.use(api + "/auth", userAuthRouter);
    app.use(api + "/user", userRouter);
    app.use(api + "/signature", signatureRouter);
    app.use(api + "/categories", categoryRouter);
    app.use(api + "/products", productRouter);
    app.use(api + "/products/upload", uploadproductRouter);
    app.use(api + "/conditions", conditionsRouter);
    app.use(api + "/price-units", priceUnitsRouter);

    app.use(api + "/post", blogRoutes);
    app.use(api + "/wallet", walletRoutes);
    app.use(api + "/messages", messagesRouter)
    app.use(api + "/cart", cartItemRouter);

    app.use(api + "/notifications", notificationRouter);
    app.use(api + "/owner-requests-user", ownerRequestUserRouter);
    app.use(api + "/owner-requests-moderator", ownerRequestModeratorRouter);
    app.use(api + "/order", orderRouter);
    app.use(api + "/tax", taxRouter);
    app.use(api + "/audit", auditRouter);
}
