const express = require("express");
const { 
  sendMessages, 
  getMessages, 
  getConversations,
  createConversation,
  getConversation
} = require("../../controller/messages/messages.Controller");
const { getStaff } = require("../../controller/messages/getStaff.controller");
const { authenticateToken } = require("../../middleware/auth");
const router = express.Router();

// Staff routes
router.get("/staff", authenticateToken, getStaff);

// Conversation routes
router.get("/conversations", authenticateToken, getConversations);
router.post("/conversations", authenticateToken, createConversation);
router.get("/conversations/:conversationId", authenticateToken, getConversation);

// Message routes
router.post("/send", authenticateToken, sendMessages);
router.get("/:conversationId", authenticateToken, getMessages);

module.exports = router;