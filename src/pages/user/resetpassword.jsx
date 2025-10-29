import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get the 'token' from the URL query string (e.g., /reset-password?token=...)
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
            return;
        }

        try {
            // Send the token and new password to your backend
            await axios.post('http://localhost:9001/api/auth/reset-password', {
                token: token,
                newPassword: password
            });

            setMessage('Password has been reset successfully. You will be redirected to the login page shortly.');

            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 4000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-lg" style={{ maxWidth: 420, width: '100%' }}>
                <h3 className="mb-4 text-center">Reset Your Password</h3>
                
                {error && <div className="alert alert-danger">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">New Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your new password"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your new password"
                            required
                        />
                    </div>
                    <button className="btn btn-primary w-100" type="submit">
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
