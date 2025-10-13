import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.email === email)) {
      alert("User already exists");
      return;
    }
    const user = { name, email, password, primary: 1000, savings: 0 };
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem(`transactions_${email}`, JSON.stringify([]));
    navigate("/dashboard");
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Left navy statements panel (same as login’s left) */}
        <div className="col-12 col-lg-6 d-none d-lg-flex p-0">
          <div
            className="w-100 d-flex flex-column justify-content-center align-items-start p-5"
            style={{
                  backgroundColor: "#fff",
                  // backgroundImage: "linear-gradient(135deg, #000080 0%, #0b1a4a 50%, #0d234f 100%)",
                  color: "#0d234f",
                }}

          >
            <h1 className="display-6 fw-semibold mb-3">Open an account</h1>
            <p className="lead mb-4">
              Join NeoBank for secure banking, instant payments, and smart insights.
            </p>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">• Zero-cost savings account</li>
              <li className="mb-2">• Real-time statements</li>
              <li className="mb-2">• Loans, cards, and EMI tracking</li>
            </ul>
          </div>
        </div>

        {/* Right register card with bg image behind it */}
        <div
          className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-lg-5"
          style={{
            // Background image behind the card
            backgroundImage:
              "linear-gradient(rgba(13,35,79,0.35), rgba(13,35,79,0.55)), url('https://media.istockphoto.com/id/1132593892/photo/dark-blue-stained-grungy-background-or-texture.jpg?s=612x612&w=0&k=20&c=CJlbaoEBefSO-YNw5v2pO_D__xn-24kmkmqApl4oPLE=')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="card shadow-sm border-0" style={{ maxWidth: 460, width: "100%" }}>
            <div className="card-body p-4 p-lg-5">
              <h3 className="card-title mb-4 text-center" style={{ color: "#000080" }}>
                Create account
              </h3>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Full name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                <button className="btn w-100 text-white" type="submit" style={{ backgroundColor: "#000080" }}>
                  Create account
                </button>
              </form>

              <div className="mt-4 text-center">
                <small>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#000080" }}>
                    Login
                  </Link>
                </small>
              </div>

              <div className="text-center mt-3">
                <small className="text-muted">
                  By creating an account, terms & privacy apply.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Register;
