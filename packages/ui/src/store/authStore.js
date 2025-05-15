import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (identifier, password, app) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await axios.post('/api/users/login', {
                        identifier,
                        password,
                        app
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // Don't follow redirects automatically
                        maxRedirects: 0,
                        validateStatus: function (status) {
                            return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
                        }
                    });

                    // If we get a redirect response, let the browser handle it
                    if (response.status >= 300 && response.status < 400) {
                        window.location.href = response.headers.location;
                        return { success: true };
                    }

                    const { token } = response.data;
                    if (!token) {
                        throw new Error('No token received from server');
                    }

                    // Store token in localStorage
                    localStorage.setItem('geek_token', token);

                    // Dynamic import with proper await
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);

                    if (!decoded || !decoded.sub) {
                        throw new Error('Invalid token structure');
                    }

                    const newState = {
                        token,
                        user: {
                            id: decoded.sub,
                            username: decoded.username,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                        error: null,
                        isLoading: false
                    };
                    set(newState);

                    return { success: true };
                } catch (error) {
                    // If it's a redirect error, let the browser handle it
                    if (error.response && error.response.status >= 300 && error.response.status < 400) {
                        window.location.href = error.response.headers.location;
                        return { success: true };
                    }

                    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
                    console.error('Authentication failed:', {
                        message: errorMessage,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null
                    });
                    return {
                        success: false,
                        error: errorMessage
                    };
                }
            },

            register: async (username, email, password) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await axios.post('/api/users', {
                        username,
                        email,
                        password,
                    });

                    const { token } = response.data;
                    if (!token) {
                        throw new Error('No token received from server');
                    }

                    // Store token in localStorage
                    localStorage.setItem('geek_token', token);

                    // Dynamic import
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);

                    if (!decoded || !decoded.sub) {
                        throw new Error('Invalid token structure');
                    }

                    set({
                        token,
                        user: {
                            id: decoded.sub,
                            username: decoded.username,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                        error: null,
                        isLoading: false
                    });

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
                    console.error('Registration failed:', {
                        message: errorMessage,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null
                    });
                    return {
                        success: false,
                        error: errorMessage
                    };
                }
            },

            logout: () => {
                localStorage.removeItem('geek_token');
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    error: null
                });
            },

            hydrateUser: async () => {
                const state = get();
                console.log('Hydrating user. Current state:', {
                    hasToken: !!state.token,
                    isAuthenticated: state.isAuthenticated
                });

                // Try to get token from multiple sources
                let token = state.token;
                if (!token) {
                    try {
                        token = localStorage.getItem('geek_token');
                        if (token) {
                            console.log('Retrieved token from localStorage backup');
                        }
                    } catch (e) {
                        console.warn('Failed to read token from localStorage:', e);
                    }
                }

                if (!token) {
                    console.log('No token found during hydration');
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: 'No authentication token found'
                    });
                    return false;
                }

                try {
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    console.log('Token validation:', {
                        expiresAt: new Date(decoded.exp * 1000).toISOString(),
                        currentTime: new Date(currentTime * 1000).toISOString(),
                        isExpired: decoded.exp < currentTime
                    });

                    if (decoded.exp < currentTime) {
                        console.log('Token expired - logging out');
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            error: 'Session expired'
                        });
                        localStorage.removeItem('geek_token');
                        return false;
                    }

                    // Verify token structure
                    if (!decoded.sub) {
                        throw new Error('Invalid token structure');
                    }

                    set({
                        token,
                        user: {
                            id: decoded.sub,
                            username: decoded.username,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                        error: null
                    });
                    return true;
                } catch (error) {
                    console.error('Session validation failed:', {
                        error: error.message,
                        stack: error.stack
                    });
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        error: 'Invalid session'
                    });
                    localStorage.removeItem('geek_token');
                    return false;
                }
            }
        }),
        {
            name: 'geek-auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);

export default useAuthStore;