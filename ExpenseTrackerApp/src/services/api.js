import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "http://172.20.56.206:3000"; // User requested this host/port

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject auth token
apiClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Adjust if InstantDB uses a specific format
      }
    } catch (e) {
      console.error('Error fetching token from storage', e);
    }
    return config;
  },
  error => Promise.reject(error),
);

// We define our core endpoints
export const syncExpense = async expenseData => {
  try {
    const res = await apiClient.post('/api/expenses', expenseData);
    return res.data;
  } catch (error) {
    console.error('Failed to sync expense to backend:', error);
    throw error;
  }
};

export const classifyExpense = async (textFields) => {
  try {
    const res = await apiClient.post('/api/parse-sms', textFields);
    return res.data;
  } catch (error) {
    console.error('Failed to classify expense via backend:', error);
    throw error;
  }
};

export default apiClient;
