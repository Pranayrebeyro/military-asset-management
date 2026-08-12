import {
    createContext,
    useContext,
    useState
} from 'react';

import api from '../services/api.js';


const AuthContext = createContext();


const decodeToken = (token) => {

    try {

        if (!token) {
            return null;
        }

        const payload =
            token.split('.')[1];

        return JSON.parse(
            atob(
                payload
                    .replace(/-/g, '+')
                    .replace(/_/g, '/')
            )
        );

    } catch (error) {

        console.error(
            'Failed to decode token:',
            error
        );

        return null;
    }
};


export const AuthProvider = ({ children }) => {

    // ========================================================
    // INITIAL TOKEN
    // ========================================================

    const initialToken =
        localStorage.getItem('token');


    // ========================================================
    // AUTH STATE
    // ========================================================

    const [token, setToken] =
        useState(initialToken);


    const [user, setUser] =
        useState(
            decodeToken(initialToken)
        );


    // ========================================================
    // LOGIN
    // ========================================================

    const login = async (
        username,
        password
    ) => {

        const response =
            await api.post(
                '/auth/login',
                {
                    username,
                    password
                }
            );


        const receivedToken =
            response.data.token;


        if (!receivedToken) {

            throw new Error(
                'Authentication token was not received'
            );
        }


        // Save token

        localStorage.setItem(
            'token',
            receivedToken
        );


        // Update state

        setToken(
            receivedToken
        );


        setUser(
            decodeToken(
                receivedToken
            )
        );


        return response.data;
    };


    // ========================================================
    // LOGOUT
    // ========================================================

    const logout = () => {

        localStorage.removeItem(
            'token'
        );

        setToken(null);

        setUser(null);
    };


    // ========================================================
    // AUTH CONTEXT
    // ========================================================

    return (

        <AuthContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                isAuthenticated: !!token
            }}
        >

            {children}

        </AuthContext.Provider>
    );
};


// ============================================================
// CUSTOM HOOK
// ============================================================

export const useAuth = () => {

    return useContext(
        AuthContext
    );
};