import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'; // Import axios

function Register() {
  // Add state for the new fields: username and phoneNo
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Define notification service URL
  const NOTIFICATION_API_URL = "http://localhost:8082/api/notify/send";

  // --- NEW: Function to send welcome notification ---
  const sendWelcomeNotification = async (userEmail, userName) => {
    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #000080;">Welcome to NeoBank!</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for creating an account with NeoBank. We're thrilled to have you with us.</p>
        <p>You can now log in to your account to explore our services, manage your finances, and much more.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <br/>
        <p>Best Regards,<br/>The NeoBank Team</p>
      </div>
    `;

    const notificationPayload = {
      to: userEmail,
      subject: "Welcome to NeoBank - Your Registration is Complete!",
      body: emailBody,
    };

    try {
      // Use axios to send the request
      await axios.post(NOTIFICATION_API_URL, notificationPayload, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("Welcome notification email sent successfully.");
    } catch (err) {
      // Log the error but don't block the user flow
      console.error("Failed to send welcome notification:", err.response?.data || err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Include the new fields in the request body
      const response = await fetch("http://localhost:9001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, phoneNo, password }),
      });

      if (response.ok) {
        // --- SEND NOTIFICATION ON SUCCESS ---
        await sendWelcomeNotification(email, username);
        
        // Redirect to login page on successful registration
        navigate("/login?registered=true");
      } else {
        // Handle errors from the backend
        const errorData = await response.json();
        setError(errorData.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please check your network and try again.");
      console.error("Registration request failed:", err);
    }
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Left Panel */}
        <div className="col-12 col-lg-6 d-none d-lg-flex p-0">
          <div
            className="w-100 d-flex flex-column justify-content-center align-items-start p-5"
            style={{ backgroundColor: "#fff", color: "#0d234f" }}
          >
            <h1 className="display-6 fw-semibold mb-3">Open an account</h1>
            <p className="lead mb-4">
              Join NeoBank for secure banking, instant payments, and smart insights.
            </p>
          </div>
        </div>

        {/* Right Registration Form */}
        <div
          className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-lg-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,35,79,0.35), rgba(13,35,79,0.55)), url('https://media.istockphoto.com/id/1132593892/photo/dark-blue-stained-grungy-background-or-texture.jpg?s=612x612&w=0&k=20&c=CJlbaoEBefSO-YNw5v2pO_D__xn-24kmkmqApl4oPLE=')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="card shadow-sm border-0" style={{ maxWidth: 460, width: "100%" }}>
            <div className="card-body p-4 p-lg-5">
              <h3 className="card-title mb-4 text-center" style={{ color: "#000080" }}>
                Create account
              </h3>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                {/* --- NEW FIELD: Username --- */}
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Choose a username"
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

                {/* --- NEW FIELD: Phone Number --- */}
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-control"
                    type="tel" // Use type="tel" for phone numbers
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    required
                    placeholder="Your phone number"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
