import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OAuth2RedirectHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Create a URLSearchParams object from the URL's search string
        const params = new URLSearchParams(location.search);
        
        // Get the 'token' from the query parameters
        const token = params.get('token');

        if (token) {
            // If a token is found, store it in localStorage
            localStorage.setItem('jwtToken', token);
            
            // Redirect the user to the dashboard or homepage
            navigate('/dashboard');
        } else {
            // If no token is found, redirect to the login page with an error
            navigate('/login?error=AuthenticationFailed');
        }
    }, [location, navigate]);

    // This component can just render a simple loading message
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Loading...</p>
        </div>
    );
};

export default OAuth2RedirectHandler;
