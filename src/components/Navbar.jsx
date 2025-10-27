import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';

export default function AppNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("user"));
        if (storedData && storedData.user) {
            setUser(storedData.user);
            setIsAdmin(storedData.user.role === 'ROLE_ADMIN');
        } else {
            setUser(null);
            setIsAdmin(false);
        }
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwtToken");
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#000080" }}>
            <div className="container-fluid">
                <Link className="navbar-brand fw-semibold" to={user ? "/dashboard" : "/login"}>
                    NeoBank
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mainNavbar"
                >
                    <span className="navbar-toggler-icon" />
                </button>
                <div className="collapse navbar-collapse" id="mainNavbar">
                    {user ? (
                        <>
                            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                                <li className="nav-item">
                                    <NavLink end to="/dashboard" className="nav-link">Home</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/accounts" className="nav-link">My Accounts</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/pay" className="nav-link">Pay</NavLink>
                                </li>
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                        Services
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-dark">
                                        <li><NavLink to="/services/loans" className="dropdown-item">Loans</NavLink></li>
                                        <li><NavLink to="/services/cards" className="dropdown-item">Cards</NavLink></li>
                                        <li><NavLink to="/services/transactions" className="dropdown-item">Transactions</NavLink></li>
                                    </ul>
                                </li>
                                {isAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/admin/branches" className="nav-link">Branch Management</NavLink>
                                    </li>
                                )}
                            </ul>
                            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                               <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                        {user.username}
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li><NavLink to="/profile/kyc" className="dropdown-item">Profile</NavLink></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><button onClick={handleLogout} className="dropdown-item">Logout</button></li>
                                    </ul>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <NavLink to="/login" className="nav-link">Login</NavLink>
                            </li>
                             <li className="nav-item">
                                <NavLink to="/register" className="nav-link">Register</NavLink>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    );
}
