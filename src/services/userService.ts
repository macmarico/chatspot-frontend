import api from './api';

// User-related API services
export const userService = {
  // Resolve username to userId
  resolveUsername: async (username: string): Promise<string> => {
    try {
      const response = await api.get(`/api/users/resolve/${username}`);
      return response.data.userId;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Failed to resolve username';
    }
  },
  
  // Get user information by userId
  getUserInfo: async (userId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Failed to get user information';
    }
  }
};
