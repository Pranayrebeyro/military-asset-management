import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
    LayoutDashboard,
    ShoppingCart,
    ArrowRightLeft,
    UserCheck,
    PackageMinus,
    LogOut
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';


const AppLayout = () => {

    const navigate = useNavigate();

    const { logout } = useAuth();


    // ========================================================
    // GET LOGGED-IN USER FROM JWT
    // ========================================================

    const getLoggedInUser = () => {

        try {

            const token =
                localStorage.getItem('token');

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
                'Failed to read user information:',
                error
            );

            return null;
        }
    };


    const user =
        getLoggedInUser();


    const username =
        user?.username || 'User';

    const role =
        user?.role || '';


    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout = () => {

        logout();

        navigate('/login');
    };


    // ========================================================
    // NAVIGATION ITEM CLASS
    // ========================================================

    const navItemClass = ({ isActive }) =>
        isActive
            ? 'nav-item active'
            : 'nav-item';


    return (

        <div className="app-layout">


            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside className="sidebar">


                {/* ==============================================
                    SIDEBAR HEADER
                ============================================== */}

                <div className="sidebar-header">

                    <h2>
                        Military Asset
                    </h2>

                    <span>
                        Management
                    </span>

                </div>


                {/* ==============================================
                    NAVIGATION
                ============================================== */}

                <nav className="sidebar-nav">


                    {/* Dashboard */}

                    <NavLink
                        to="/dashboard"
                        className={navItemClass}
                    >

                        <LayoutDashboard size={20} />

                        <span>
                            Dashboard
                        </span>

                    </NavLink>


                    {/* Purchases */}

                    <NavLink
                        to="/purchases"
                        className={navItemClass}
                    >

                        <ShoppingCart size={20} />

                        <span>
                            Purchases
                        </span>

                    </NavLink>


                    {/* Transfers */}

                    <NavLink
                        to="/transfers"
                        className={navItemClass}
                    >

                        <ArrowRightLeft size={20} />

                        <span>
                            Transfers
                        </span>

                    </NavLink>


                    {/* Assignments */}

                    <NavLink
                        to="/assignments"
                        className={navItemClass}
                    >

                        <UserCheck size={20} />

                        <span>
                            Assignments
                        </span>

                    </NavLink>


                    {/* Expenditures */}

                    <NavLink
                        to="/expenditures"
                        className={navItemClass}
                    >

                        <PackageMinus size={20} />

                        <span>
                            Expenditures
                        </span>

                    </NavLink>

                </nav>


                {/* ==============================================
                    LOGOUT
                ============================================== */}

                <div className="sidebar-bottom">

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >

                        <LogOut size={20} />

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* ==================================================
                MAIN CONTENT
            ================================================== */}

            <main className="main-content">


                {/* ==============================================
                    TOP BAR
                ============================================== */}

                <header className="topbar">

                    <div>

                        <span>
                            Military Asset Management System
                        </span>

                    </div>


                    <div className="user-info">

                        <div>

                            <strong>
                                {username}
                            </strong>

                            <small>
                                {role}
                            </small>

                        </div>

                    </div>

                </header>


                {/* ==============================================
                    PAGE CONTENT
                ============================================== */}

                <section className="page-content">

                    <Outlet />

                </section>

            </main>

        </div>
    );
};


export default AppLayout;