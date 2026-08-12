import './App.css';

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import {
    AuthProvider,
    useAuth
} from './context/AuthContext.jsx';

import AppLayout from './components/AppLayout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Purchases from './pages/Purchases.jsx';
import Transfers from './pages/Transfers.jsx';
import Assignments from './pages/Assignments.jsx';
import Expenditures from './pages/Expenditures.jsx';


// ============================================================
// PROTECTED ROUTE
// ============================================================

const ProtectedRoute = ({ children }) => {

    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
};


// ============================================================
// APPLICATION ROUTES
// ============================================================

const AppRoutes = () => {

    return (
        <Routes>

            {/* =================================================
                LOGIN
            ================================================= */}

            <Route
                path="/login"
                element={<Login />}
            />


            {/* =================================================
                PROTECTED APPLICATION
            ================================================= */}

            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >

                {/* Dashboard */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />


                {/* Purchases */}

                <Route
                    path="/purchases"
                    element={<Purchases />}
                />


                {/* Transfers */}

                <Route
                    path="/transfers"
                    element={<Transfers />}
                />


                {/* Assignments */}

                <Route
                    path="/assignments"
                    element={<Assignments />}
                />


                {/* Expenditures */}

                <Route
                    path="/expenditures"
                    element={<Expenditures />}
                />

            </Route>


            {/* =================================================
                DEFAULT ROUTE
            ================================================= */}

            <Route
                path="/"
                element={
                    <Navigate
                        to="/dashboard"
                        replace
                    />
                }
            />


            {/* =================================================
                UNKNOWN ROUTES
            ================================================= */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/dashboard"
                        replace
                    />
                }
            />

        </Routes>
    );
};


// ============================================================
// APP
// ============================================================

const App = () => {

    return (
        <BrowserRouter>

            <AuthProvider>

                <AppRoutes />

            </AuthProvider>

        </BrowserRouter>
    );
};

export default App;