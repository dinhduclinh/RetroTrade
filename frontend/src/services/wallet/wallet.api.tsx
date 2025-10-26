// ...existing code...
import instance from "../customizeAPI";


// const parseFetchResponse = async (res: any) => {
//   if (!res) throw new Error("Empty response from API");

//   // axios-like: response.data present (axios sẽ tự throw, nhưng fetch với custom adapter thì mình phải throw)
//   if (res.data !== undefined) {
//     if (res.status && res.status >= 400) {
//       throw { response: { data: res.data, status: res.status } };
//     }
//     return res.data;
//   }

//   // fetch Response-like hoặc custom res
//   if (typeof res.ok !== "undefined" && typeof res.status !== "undefined") {
//     if (!res.ok || res.status >= 400) {
//       let body = null;
//       try {
//         body = await res.json();
//       } catch {
//         body = await res.text();
//       }
//       throw { response: { data: body, status: res.status } };
//     }
//     try {
//       return await res.json();
//     } catch {
//       return await res.text();
//     }
//   }

//   // Nếu chưa biết, trả về nguyên trạng để debug
//   return res;
// };
const parseFetchResponse = async (res: any) => {
  if (!res) throw new Error("Empty response from API");

  // axios-like
  if (res.data !== undefined) {
    if (res.status && res.status >= 400) {
      throw { response: { data: res.data, status: res.status } };
    }
    return res.data;
  }

  // fetch Response-like
  if (typeof res.ok !== "undefined" && typeof res.status !== "undefined") {
    if (!res.ok || res.status >= 400) {
      let body = null;
      // Chỉ cố gắng đọc JSON (nếu lỗi thì gán err.message)
      try {
        body = await res.clone().json();
      } catch {
        try {
          body = await res.clone().text();
        } catch {
          body = "Lỗi đọc body response";
        }
      }
      throw { response: { data: body, status: res.status } };
    }
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // fallback
  return res;
};



export const getMyWallet = async () => {
  try {
    const res = await instance.get("/wallet/my-wallet");
    return await parseFetchResponse(res);
  } catch (err) {
    console.error("[wallet.api] getMyWallet error:", err);
    throw err;
  }
};

export const depositToWallet = async (amount: number, note?: string) => {
  try {
    const res = await instance.post("/wallet/deposit", { amount, note });
    const parsed = await parseFetchResponse(res);
    return parsed;
  } catch (error) {
    console.error("[wallet.api] depositToWallet error:", error);
    throw error;
  }
};

export const getAllBankAccounts = async () => {
  try {
    const res = await instance.get("/wallet/my-banks"); // Đúng route đã khai báo backend
    return await parseFetchResponse(res);
  } catch (err) {
    console.error("[bank.api] getAllBankAccounts error:", err);
    throw err;
  }
};

// Thêm tài khoản ngân hàng mới
export const addBankAccount = async (bankData: any) => {
  try {
    const res = await instance.post("/wallet/add", bankData);
    return await parseFetchResponse(res);
  } catch (err) {
    console.error("[bank.api] addBankAccount error:", err);
    throw err;
  }
};


// Xóa tài khoản ngân hàng theo Id
export const deleteBankAccount = async (id: string) => {
  try {
    const res = await instance.delete(`/wallet/delete/${id}`);
    return await parseFetchResponse(res);
  } catch (err) {
    console.error("[bank.api] deleteBankAccount error:", err);
    throw err;
  }
};

// Gọi API rút tiền từ ví
export const withdrawFromWallet = async (amount: number, note: string, bankAccountId: string) => {
  try {
    const res = await instance.post("/wallet/withdraw", { amount, note, bankAccountId });
    return await parseFetchResponse(res);
  } catch (error: any) {
    console.error("[wallet.api] withdrawFromWallet error:", error);
    throw error;
  }
};

// role admin 
// API admin lấy danh sách yêu cầu rút tiền, có thể truyền status để filter
export const getWithdrawalRequests = async (status?: string) => {
  try {
    const url = status ? `/wallet/withdrawal-requests?status=${status}` : `/wallet/withdrawal-requests`;
    const res = await instance.get(url);
    return await parseFetchResponse(res);
  } catch (error) {
    console.error("[wallet.api] getWithdrawalRequests error:", error);
    throw error;
  }
};

// API admin duyệt hoặc từ chối yêu cầu rút tiền
export const reviewWithdrawalRequest = async (
  transactionId: string,
  action: "approve" | "reject",
  adminNote: string = ""
) => {
  try {
    const res = await instance.put(`/wallet/withdrawal-requests/${transactionId}/review`, {
      action,
      adminNote,
    });
    return await parseFetchResponse(res);
  } catch (error) {
    console.error("[wallet.api] reviewWithdrawalRequest error:", error);
    throw error;
  }
};

// API admin đánh dấu hoàn thành chuyển tiền
export const completeWithdrawal = async (transactionId: string, adminNote: string = "") => {
  try {
    const res = await instance.put(`/wallet/withdrawal-requests/${transactionId}/complete`, {
      adminNote,
    });
    return await parseFetchResponse(res);
  } catch (error) {
    console.error("[wallet.api] completeWithdrawal error:", error);
    throw error;
  }
};
// API admin xem tất cả giao dịch ví
export const getAllWalletTransactions = async () => {
  try {
    const res = await instance.get("/wallet/transactions");  // route backend
    return await parseFetchResponse(res);
  } catch (error) {
    console.error("[wallet.api] getAllWalletTransactions error:", error);
    throw error;
  }
};


