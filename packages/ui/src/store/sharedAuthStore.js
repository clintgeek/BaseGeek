import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useSharedAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            currentApp: null,

            // Initialize auth state
            initialize: async (app) => {
                const state = get();
                if (!state.token) return false;

                try {
                    const response = await axios.post('/api/auth/validate', {
                        token: state.token,
                        app
                    });

                    if (response.data.valid) {
                        set({
                            user: response.data.user,
                            isAuthenticated: true,
                            currentApp: app,
                            error: null
                        });
                        return true;
                    }
                } catch (error) {
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        currentApp: null,
                        error: 'Session expired'
                    });
                }
                return false;
            },

            // Login to any app
            login: async (identifier, password, app) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await axios.post('/api/auth/login', {
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
                        currentApp: app,
                        error: null,
                        isLoading: false
                    });

                    // Broadcast auth state change
                    window.postMessage({
                        type: 'GEEK_AUTH_STATE_CHANGE',
                        payload: { token, user, app }
                    }, '*');

                    return response.data;
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null,
                        currentApp: null
                    });
                    return { error: errorMessage };
                }
            },

            // Register new user
            register: async (username, email, password, app) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await axios.post('/api/auth/register', {
                        username,
                        email,
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
                        currentApp: app,
                        error: null,
                        isLoading: false
                    });

                    // Broadcast auth state change
                    window.postMessage({
                        type: 'GEEK_AUTH_STATE_CHANGE',
                        payload: { token, user, app }
                    }, '*');

                    return response.data;
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null,
                        currentApp: null
                    });
                    return { error: errorMessage };
                }
            },

            // Logout from all apps
            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    currentApp: null,
                    error: null
                });

                // Broadcast logout
                window.postMessage({
                    type: 'GEEK_AUTH_STATE_CHANGE',
                    payload: { token: null, user: null, app: null }
                }, '*');
            },

            // Check auth status
            checkAuth: async () => {
                const state = get();
                if (!state.token || !state.currentApp) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: null
                    });
                    return false;
                }

                try {
                    const response = await axios.post('/api/auth/validate', {
                        token: state.token,
                        app: state.currentApp
                    });

                    if (response.data.valid) {
                        set({
                            user: response.data.user,
                            isAuthenticated: true,
                            error: null
                        });
                        return true;
                    }
                } catch (error) {
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        currentApp: null,
                        error: 'Session expired'
                    });
                }
                return false;
            },

            // Refresh token
            refreshToken: async () => {
                const state = get();
                if (!state.token || !state.currentApp) return false;

                try {
                    const response = await axios.post('/api/auth/refresh', {
                        token: state.token,
                        app: state.currentApp
                    });

                    const { token, user } = response.data;
                    set({
                        token,
                        user,
                        isAuthenticated: true,
                        error: null
                    });

                    // Broadcast token refresh
                    window.postMessage({
                        type: 'GEEK_AUTH_STATE_CHANGE',
                        payload: { token, user, app: state.currentApp }
                    }, '*');

                    return true;
                } catch (error) {
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        currentApp: null,
                        error: 'Session expired'
                    });
                    return false;
                }
            }
        }),
        {
            name: 'geek-shared-auth',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                currentApp: state.currentApp
            })
        }
    )
);

// Listen for auth state changes from other apps
if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
        if (event.data.type === 'GEEK_AUTH_STATE_CHANGE') {
            const { token, user, app } = event.data.payload;
            useSharedAuthStore.setState({
                token,
                user,
                isAuthenticated: !!token,
                currentApp: app
            });
        }
    });
}

export default useSharedAuthStore;