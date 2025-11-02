import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { PersonCircle, BoxArrowRight } from 'react-bootstrap-icons';

// --- DESIGN TOKENS ---
const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    borderBottom: '1px solid rgba(209, 213, 219, 0.4)'
};

const brandColors = {
    navy: '#012169',
    red: '#E31837'
};

// Helper function to apply the custom two-tone color to text
const TwoToneText = ({ text }) => {
    if (!text) return null;
    const firstChar = text.charAt(0);
    const rest = text.slice(1);
    return (
        <>
            <span style={{ color: brandColors.red, fontWeight: 'inherit' }}>{firstChar}</span>
            <span style={{ color: brandColors.navy }}>{rest}</span>
        </>
    );
};

export default function AppNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("user"));
        if (storedData?.user) {
            setUser(storedData.user);
            setIsAdmin(storedData.user.role === 'ROLE_ADMIN');
        } else {
            setUser(null);
            setIsAdmin(false);
        }
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Style for the currently active NavLink (REMOVED BOLD)
    const activeLinkStyle = {
        transform: 'scale(1.05)',
        fontWeight: '500', // Kept font-weight normal, removed bold
        textDecoration: 'underline',
        textDecorationColor: brandColors.navy,
        textUnderlineOffset: '6px',
        textDecorationThickness: '2px',
    };

    const linkStyle = {
        fontWeight: '500',
        transition: 'transform 0.2s ease-in-out, text-decoration 0.2s ease'
    };

    return (
        <nav className="navbar navbar-expand-lg sticky-top py-2" style={glassmorphismStyle}>
            <div className="container-fluid">
                
                <Link className="navbar-brand fw-bold fs-4" to={user ? "/dashboard" : "/login"} style={{ color: brandColors.navy }}>
                    NeoBank
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar">
                    <span className="navbar-toggler-icon" />
                </button>

                <div className="collapse navbar-collapse" id="mainNavbar">
                    {user ? (
                        <>
                            {/* Centered Navigation Links */}
                            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 ms-1 align-items-center">
                                <li className="nav-item"><NavLink to="/dashboard" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Home" /></NavLink></li>
                                <li className="nav-item"><NavLink to="/accounts" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Accounts" /></NavLink></li>
                                <li className="nav-item"><NavLink to="/pay" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Payments" /></NavLink></li>
                                <li className="nav-item"><NavLink to="/services/transactions" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Transactions" /></NavLink></li>

                                
                                {/* --- CONDITIONAL LINKS FOR USERS --- */}
                                {!isAdmin && (
                                    <>
                                        
                                        <li className="nav-item"><NavLink to="/services/loans" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Loans" /></NavLink></li>
                                        <li className="nav-item"><NavLink to="/services/cards" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Cards" /></NavLink></li>
                                    </>
                                )}

                                
                                {/* --- CONDITIONAL LINKS FOR ADMINS --- */}
                                {isAdmin && (
                                    <>
                                        <li className="nav-item"><NavLink to="/admin/loans" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Loan Approvals" /></NavLink></li>
                                        <li className="nav-item"><NavLink to="/admin/cardsmanagement" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Card Approvals" /></NavLink></li>
                                        <li className="nav-item"><NavLink to="/admin/branches" className="nav-link px-3" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Branches" /></NavLink></li>

                                    </>
                                )}
                            </ul>

                            {/* Right-aligned User Profile Section */}
                            <ul className="navbar-nav ms-auto">
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown" style={{ color: brandColors.navy }}>
                                        <PersonCircle className="me-2 fs-5" />
                                        {user.username}
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li><NavLink to="/profile/kyc" className="dropdown-item"><PersonCircle className="me-2"/>Profile</NavLink></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><button onClick={handleLogout} className="dropdown-item text-danger d-flex align-items-center"><BoxArrowRight className="me-2"/>Logout</button></li>
                                    </ul>
                                </li>
                            </ul>
                        </>
                    ) : (
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item"><NavLink to="/login" className="nav-link" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Login" /></NavLink></li>
                            <li className="nav-item"><NavLink to="/register" className="nav-link" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}><TwoToneText text="Register" /></NavLink></li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    );
}
