const Notification = require("../models/Notification.model");

/**
 * Utility function to create notifications easily
 * Can be imported and used in any controller
 * 
 * @param {String} userId - User ID to send notification to
 * @param {String} notificationType - Type of notification (e.g., "Login Success", "Order Placed")
 * @param {String} title - Notification title
 * @param {String} body - Notification body/content
 * @param {Object} metadata - Optional metadata object (will be stringified)
 * @returns {Promise<Notification|null>} Created notification or null on error
 * 
 * @example
 * const { createNotification } = require("../utils/createNotification");
 * await createNotification(
 *   userId,
 *   "Order Placed",
 *   "Đơn hàng mới",
 *   "Bạn có một đơn hàng mới #12345",
 *   { orderId: "12345", total: 100000 }
 * );
 */
const createNotification = async (userId, notificationType, title, body, metadata = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      notificationType: notificationType,
      title: title,
      body: body,
      metaData: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

module.exports = { createNotification };

