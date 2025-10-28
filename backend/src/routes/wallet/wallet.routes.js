const express = require("express");
const { getMyWallet, depositToWallet, handlePayOSWebhook, withdrawFromWallet } = require("../../controller/wallet/wallet.Controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const { addBankAccount, getAllBankAccounts, deleteBankAccount } = require("../../controller/wallet/bank.Controler");
const{ getWithdrawalRequests, reviewWithdrawalRequest, completeWithdrawal, getAllWalletTransactions } = require("../../controller/wallet/admin.Controller");
const router = express.Router();


router.get("/my-wallet", authenticateToken, getMyWallet);
router.post("/deposit", authenticateToken, depositToWallet);
router.post("/payos-webhook", handlePayOSWebhook);
router.post('/add', authenticateToken, addBankAccount);
router.get('/my-banks', authenticateToken, getAllBankAccounts);
router.delete('/delete/:id', authenticateToken, deleteBankAccount);
// người dùng rút tiền từ ví
router.post("/withdraw", authenticateToken, withdrawFromWallet);

// Các router chỉ admin  có quyền truy cập
router.get("/withdrawal-requests", authenticateToken, authorizeRoles("admin"),getWithdrawalRequests);
router.put("/withdrawal-requests/:transactionId/review", authenticateToken, authorizeRoles("admin"), reviewWithdrawalRequest);
router.put("/withdrawal-requests/:transactionId/complete", authenticateToken, authorizeRoles("admin"), completeWithdrawal);
router.get("/transactions", authenticateToken, authorizeRoles("admin"), getAllWalletTransactions);
module.exports = router; 