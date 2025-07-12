import axios from 'axios';

// Replace with your computer's local IP address
// To find your IP: Windows (ipconfig), Mac/Linux (ifconfig)
const BASE_URL = 'http://192.168.1.100:5000'; // Change this to your computer's IP

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  },
);

export interface Customer {
  customer_id: string;
  name: string;
  phone_number: string;
  address: string;
  customer_type: 'shop' | 'monthly' | 'order';
  can_qty?: number;
  advance_amount?: number;
}

export interface DailyUpdateData {
  customer_id: string;
  date: string;
  delivered_qty: number;
  collected_qty: number;
  notes?: string;
}

export const customerAPI = {
  // Get all customers
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/api/customers');
    return response.data;
  },

  // Search customers by name or phone
  searchCustomers: async (query: string): Promise<Customer[]> => {
    const response = await api.get('/api/customers');
    const customers = response.data;
    return customers.filter((customer: Customer) =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone_number.includes(query)
    );
  },
};

export const dailyUpdateAPI = {
  // Get daily updates for a specific date
  getDailyUpdates: async (date: string) => {
    const response = await api.get(`/api/daily-updates?date=${date}`);
    return response.data;
  },

  // Save daily update
  saveDailyUpdate: async (updateData: DailyUpdateData) => {
    const response = await api.post('/api/daily-updates', updateData);
    return response.data;
  },

  // Get customer's current holding status
  getCustomerStatus: async (customerId: string, date: string) => {
    const response = await api.get(`/api/daily-updates?date=${date}`);
    const updates = response.data;
    return updates.find((update: any) => update.customer_id === customerId);
  },
};

export default api;