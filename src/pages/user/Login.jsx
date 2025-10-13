import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      localStorage.setItem("currentUser", JSON.stringify(found));
      navigate("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Left design panel */}
        <div className="col-12 col-lg-6 d-none d-lg-flex p-0">
  <div
    className="w-100 d-flex flex-column justify-content-center align-items-start p-5"
    style={{
      backgroundImage:
        "linear-gradient(rgba(13,35,79,0.70), rgba(13,35,79,0.70)), url('https://media.istockphoto.com/id/1132593892/photo/dark-blue-stained-grungy-background-or-texture.jpg?s=612x612&w=0&k=20&c=CJlbaoEBefSO-YNw5v2pO_D__xn-24kmkmqApl4oPLE=')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "#fff",
      minHeight: "100vh",
    }}
  >
    <h1 className="display-5 fw-semibold mb-3">Welcome to NeoBank</h1>
    <p className="lead mb-4">Secure banking, instant payments, and smart insights in one place.</p>
    <ul className="list-unstyled mb-0">
      <li className="mb-2">• Real-time balances and statements</li>
      <li className="mb-2">• Fast transfers and UPI</li>
      <li className="mb-2">• Loans, cards, and EMI tracking</li>
    </ul>
  </div>
</div>


        {/* Right login card */}
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-lg-5">
          <div className="card shadow-lg border-0" style={{ maxWidth: 420, width: "100%" }}>
            <div className="card-body p-4 p-lg-5">
              <h3 className="card-title mb-4 text-center">Login</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" />
                    <label className="form-check-label" htmlFor="remember">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot" className="small text-decoration-none">
                    Forgot password?
                  </Link>
                </div>
                <button className="btn btn-primary w-100" type="submit">
                  Login
                </button>
              </form>

              <div className="mt-4 text-center">
                <small>
                  Don&apos;t have an account? <Link to="/register">Register</Link>
                </small>
              </div>

              {/* Social/auth hints (optional) */}
              <div className="text-center mt-3">
                <small className="text-muted">By continuing, terms & privacy apply.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Login;
