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
                    });

                    const { token, user } = response.data;
                    if (!token || !user) {
                        throw new Error('Invalid response from server');
                    }

                    set({
                        token,
                        user,
                        isAuthenticated: true,
                        error: null,
                        isLoading: false
                    });

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null
                    });
                    return { success: false, error: errorMessage };
                }
            },

            register: async (username, email, password) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await axios.post('/api/users', {
                        username,
                        email,
                        password
                    });

                    const { token, user } = response.data;
                    if (!token || !user) {
                        throw new Error('Invalid response from server');
                    }

                    set({
                        token,
                        user,
                        isAuthenticated: true,
                        error: null,
                        isLoading: false
                    });

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null
                    });
                    return { success: false, error: errorMessage };
                }
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    error: null
                });
            },

            checkAuth: async () => {
                const state = get();
                if (!state.token) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null
                    });
                    return false;
                }

                try {
                    const response = await axios.get('/api/users/me', {
                        headers: { Authorization: `Bearer ${state.token}` }
                    });

                    set({
                        user: response.data.user,
                        isAuthenticated: true,
                        error: null
                    });
                    return true;
                } catch (error) {
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        error: 'Session expired'
                    });
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