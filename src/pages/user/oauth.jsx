import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Make sure to import axios

const OAuth2RedirectHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const hasExecuted = useRef(false);

    useEffect(() => {
        if (hasExecuted.current) {
            return;
        }

        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        const completeLogin = async (authToken) => {
            try {
                // Step 1: Use the token to fetch user data from the backend
                const userResponse = await axios.get('http://localhost:9001/api/user/me', {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                });

                // --- THE FIX ---
                // Step 2: Create an object that matches the structure of your manual LoginResponse.
                const loginData = {
                    accessToken: authToken,
                    user: userResponse.data,
                    tokenType: "Bearer"
                };

                // Step 3: Store the consistent loginData object and the token separately.
                localStorage.setItem('user', JSON.stringify(loginData));
                localStorage.setItem('jwtToken', authToken);

                // Step 4: Now that the data structure is consistent, redirect to the dashboard.
                hasExecuted.current = true;
                navigate('/dashboard', { replace: true });

            } catch (error) {
                console.error("Failed to process OAuth2 login:", error);
                navigate('/login?error=LoginFailed', { replace: true });
            }
        };

        if (token) {
            completeLogin(token);
        } else {
            console.error("OAuth2 Redirect: No token found.");
            navigate('/login?error=AuthenticationFailed', { replace: true });
        }
    }, [navigate, location]);

    return <div>Processing authentication...</div>;
};

export default OAuth2RedirectHandler;
