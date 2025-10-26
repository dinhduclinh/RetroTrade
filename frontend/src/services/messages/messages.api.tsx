import api from "../customizeAPI";

export interface SendMessageParams {
  conversationId: string;
  content: string;
}

export const sendMessage = async ({ conversationId, content }: SendMessageParams) => {
  // Gọi API gửi tin nhắn, token sẽ được tự động add trong header do customizeAPI xử lý
  return api.post(`/messages/send`, { conversationId, content });
};

export const getMessages = async (conversationId: string) => {
  // Gọi API lấy tin nhắn theo id cuộc trò chuyện, tự động có header token
  return api.get(`/messages/${conversationId}`);
};
