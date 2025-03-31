import axios from 'axios';

const instance = axios.create({
    // baseURL: 'http://localhost:5000/api',
    baseURL: 'https://razorpay-testing-backend.vercel.app/api',
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            // Handle other errors
            return Promise.reject(error.response.data);
        }

        return Promise.reject(error);
    }
);

export default instance; 