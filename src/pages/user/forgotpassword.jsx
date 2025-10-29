import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await axios.post(`http://localhost:9001/api/auth/forgot-password?email=${email}`);
      setMessage("Password reset instructions have been sent to your email.");
      setEmail(""); // Clear the input
      // Optionally redirect to login after delay
      setTimeout(() => {
        navigate("/login");
      }, 4000);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.message || "An error occurred. Please try again."
        );
      } else {
        setError("Request failed. Please try again later.");
      }
      console.error("Forgot password request failed:", err);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4" style={{ maxWidth: 400, width: "100%" }}>
        <h3 className="mb-4 text-center">Forgot Password</h3>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="emailInput" className="form-label">
              Enter your registered email
            </label>
            <input
              type="email"
              id="emailInput"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-100" type="submit">
            Send Reset Link
          </button>
        </form>
        <div className="mt-3 text-center">
          <a href="/login" className="text-decoration-none">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
