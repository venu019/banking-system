import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // This effect checks for an 'error' query parameter in the URL on page load.
  // This is useful for catching errors from external redirects, like OAuth2 failures.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error')) {
      setError('Authentication failed. Please try again.');
    }
  }, [location]);

  // This effect redirects the user to the dashboard after a successful login.
  useEffect(() => {
    if (loginSuccess) {
      navigate("/dashboard");
    }
  }, [loginSuccess, navigate]);

  // Handles the form submission for local email/password login.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("http://localhost:9001/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("user", JSON.stringify(response.data));
      console.log(response.data);
      localStorage.setItem("jwtToken", response.data.accessToken);
      console.log("Login successful:", response.data.accessToken);

      setLoginSuccess(true);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Invalid credentials.");
      } else {
        setError("Login failed. Please try again.");
      }
      console.error("Login request failed:", err);
    }
  };

  // Initiates the Google OAuth2 login flow by redirecting to the backend.
  const googleLogin = () => {
    window.location.href = "http://localhost:9001/oauth2/authorization/google";
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Left-side branding panel */}
        <div className="col-12 col-lg-6 d-none d-lg-flex p-0">
          <div
            className="w-100 d-flex flex-column justify-content-center align-items-start p-5"
            style={{
              backgroundImage: "linear-gradient(rgba(13,35,79,0.70), rgba(13,35,79,0.70)), url('https://media.istockphoto.com/id/1132593892/photo/dark-blue-stained-grungy-background-or-texture.jpg?s=612x612&w=0&k=20&c=CJlbaoEBefSO-YNw5v2pO_D__xn-24kmkmqApl4oPLE=')",
              backgroundSize: "cover",
              color: "#fff",
            }}
          >
            <h1 className="display-5 fw-semibold mb-3">Welcome to NeoBank</h1>
            <p className="lead mb-4">Secure banking, instant payments, and smart insights in one place.</p>
          </div>
        </div>

        {/* Right-side login form */}
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-lg-5">
          <div className="card shadow-lg border-0" style={{ maxWidth: 420, width: "100%" }}>
            <div className="card-body p-4 p-lg-5">
              <h3 className="card-title mb-4 text-center">Login</h3>
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="d-flex justify-content-end mb-3">
                  <Link to="/forgot-password" className="small text-decoration-none">Forgot password?</Link>
                </div>
                <button className="btn btn-primary w-100 mb-3" type="submit">Login</button>
              </form>

              <div className="text-center my-3"><span className="text-muted small">OR</span></div>

              <button onClick={googleLogin} className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google icon" style={{ width: 20, marginRight: 10 }} />
                Sign in with Google
              </button>

              <div className="mt-4 text-center">
                <small>Don't have an account? <Link to="/register">Register</Link></small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
