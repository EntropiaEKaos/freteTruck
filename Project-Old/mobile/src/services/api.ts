import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para adicionar cookie de sessão
api.interceptors.request.use(async (config) => {
  const session = await SecureStore.getItemAsync("ft_session");
  if (session) {
    config.headers.Cookie = `ft_session=${session}`;
  }
  return config;
});

// Interceptor para salvar cookie da resposta
api.interceptors.response.use(
  async (response) => {
    const setCookie = response.headers["set-cookie"];
    if (setCookie && setCookie.length > 0) {
      const match = setCookie[0].match(/ft_session=([^;]+)/);
      if (match) await SecureStore.setItemAsync("ft_session", match[1]);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("ft_session");
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authAPI = {
  me: () => api.get("/api/auth/me"),
  login: (email: string, password: string) => api.post("/api/auth/login", { email, password }),
  register: (data: any) => api.post("/api/auth/register", data),
  logout: () => api.post("/api/auth/logout"),
  updateProfile: (data: any) => api.patch("/api/auth/profile", data),
  forgotPassword: (email: string) => api.post("/api/auth/forgot", { email }),
  resetPassword: (token: string, password: string) => api.post("/api/auth/reset", { token, password }),
};

// ============ FREIGHTS ============
export const freightAPI = {
  list: (params?: any) => api.get("/api/freights", { params }),
  detail: (id: number) => api.get(`/api/freights/${id}`),
  create: (data: any) => api.post("/api/freights", data),
  update: (id: number, data: any) => api.patch(`/api/freights/${id}`, data),
  delete: (id: number) => api.delete(`/api/freights/${id}`),
  mine: () => api.get("/api/freights", { params: { mine: 1 } }),
  deliver: (id: number) => api.post("/api/freights/deliver", { freightId: id }),
};

// ============ PROPOSALS ============
export const proposalAPI = {
  list: () => api.get("/api/proposals"),
  received: () => api.get("/api/proposals", { params: { received: 1 } }),
  create: (data: any) => api.post("/api/proposals", data),
  respond: (id: number, status: string) => api.patch(`/api/proposals/${id}`, { status }),
  cancel: (id: number) => api.delete(`/api/proposals/${id}`),
};

// ============ MESSAGES ============
export const messageAPI = {
  conversations: () => api.get("/api/messages"),
  messages: (withUserId: number) => api.get(`/api/messages?with=${withUserId}`),
  send: (receiverId: number, content: string) => api.post("/api/messages", { receiverId, content }),
};

// ============ NOTIFICATIONS ============
export const notificationAPI = {
  list: () => api.get("/api/notifications"),
  count: () => api.get("/api/notifications?count=1"),
  markAllRead: () => api.patch("/api/notifications", { readAll: true }),
};

// ============ TRUCKS ============
export const truckAPI = {
  wallet: () => api.get("/api/trucks/wallet"),
  products: () => api.get("/api/trucks/products"),
  orders: () => api.get("/api/trucks/orders"),
  createOrder: (productId: number) => api.post("/api/trucks/orders", { productId }),
  checkout: (orderId: number) => api.post(`/api/trucks/orders/${orderId}/checkout`, {}),
  pay: (orderId: number) => api.post(`/api/trucks/orders/${orderId}/pay`, {}),
};

// ============ COMMUNITY ============
export const communityAPI = {
  posts: (params?: any) => api.get("/api/community", { params }),
  createPost: (data: any) => api.post("/api/community", data),
  like: (postId: number) => api.post("/api/community/like", { postId }),
  comments: (postId: number) => api.get(`/api/community/${postId}/comments`),
  createComment: (postId: number, content: string, parentId?: number) =>
    api.post(`/api/community/${postId}/comments`, { content, parentId }),
  likeComment: (commentId: number) => api.post("/api/community/comment-like", { commentId }),
};

// ============ PROFILE ============
export const profileAPI = {
  get: (id: number) => api.get(`/api/profile/${id}`),
};

// ============ STATS ============
export const statsAPI = {
  global: () => api.get("/api/stats"),
  analytics: () => api.get("/api/analytics"),
  rankings: () => api.get("/api/rankings"),
};

// ============ FISCAL ============
export const fiscalAPI = {
  list: () => api.get("/api/fiscal"),
  create: (data: any) => api.post("/api/fiscal", data),
  xml: (id: number) => api.get(`/api/fiscal/${id}`),
  action: (id: number, action: string, reason?: string) => api.patch(`/api/fiscal/${id}`, { action, reason }),
  events: (id: number) => api.get(`/api/fiscal/${id}/events`),
};

// ============ AI PRICE ============
export const aiAPI = {
  price: (params: any) => api.get("/api/ai-price", { params }),
  antt: (params: any) => api.get("/api/antt", { params }),
};

export default api;
