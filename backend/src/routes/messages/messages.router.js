const express = require("express");
const { sendMessages, getMessages } = require("../../controller/messages/messages.controller");
const { authenticateToken } = require("../../middleware/auth");
const router = express.Router();

router.post("/send", authenticateToken, sendMessages);
router.get("/:conversationId", authenticateToken, getMessages);

module.exports = router;