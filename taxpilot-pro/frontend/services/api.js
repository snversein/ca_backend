import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://ca-backend-psi.vercel.app/api';

console.log('API Base URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async setToken(token) {
    await AsyncStorage.setItem('authToken', token);
  }

  async setBaseUrl(url) {
    this.client.defaults.baseURL = url;
  }

  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(endpoint, data = {}) {
    try {
      console.log('API POST:', endpoint, JSON.stringify(data));
      const response = await this.client.post(endpoint, data);
      console.log('API Response:', response.status, response.data);
      return response;
    } catch (error) {
      console.log('API Error:', error.message, error.response?.status, error.response?.data);
      throw this.handleError(error);
    }
  }

  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadFile(endpoint, formData, onProgress) {
    try {
      const response = await this.client.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      if (error.response.status === 401) {
        return {
          message: 'Unauthorized',
          status: 401,
          data: error.response.data,
        };
      }
      return {
        message: error.response.data?.error || error.response.data?.message || 'Server error',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      console.error('Network Error - No response received');
      console.error('Request:', error.request);
      return {
        message: 'Cannot connect to server. Please check if backend is running.',
        status: 0,
      };
    } else {
      console.error('API Error:', error);
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
      };
    }
  }
}

export const api = new ApiService();

export const authService = {
  login: (identifier, password) => {
    const isEmail = identifier.includes('@');
    const payload = isEmail 
      ? { email: identifier, password } 
      : { phone: identifier, password };
    return api.post('/auth/login', payload);
  },
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const documentService = {
  getDocuments: (params) => api.get('/documents', params),
  getDocument: (id) => api.get(`/documents/${id}`),
  uploadDocument: (formData) => api.uploadFile('/documents/upload', formData),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  getDocumentTypes: () => api.get('/documents/types'),
  getDownloadUrl: (id) => api.get(`/documents/${id}/download`),
};

export const folderService = {
  getFolders: () => api.get('/folders'),
  getFolder: (id) => api.get(`/folders/${id}`),
  getFolderDocuments: (id) => api.get(`/folders/${id}/documents`),
  createFolder: (data) => api.post('/folders', data),
};

export const taxService = {
  calculateTax: (data) => api.post('/tax/calculate', data),
  estimateITR: (data) => api.post('/tax/estimate-itr', data),
  getSuggestions: () => api.get('/tax/suggestions'),
  getTaxSlabs: () => api.get('/tax/slabs'),
  getTaxRecords: (params) => api.get('/tax/records', params),
};

export const form16Service = {
  extractForm16: (formData) => api.uploadFile('/form16/extract', formData),
  uploadForm16: (formData) => api.uploadFile('/form16/upload', formData),
  getTemplate: () => api.get('/form16/template'),
};

export const chatbotService = {
  query: (message, history) => api.post('/chatbot/query', { message, history }),
  getTopics: () => api.get('/chatbot/topics'),
  getQuickActions: () => api.get('/chatbot/quick-actions'),
};

export const contactService = {
  submitQuery: (data) => api.post('/contact/submit', data),
};
