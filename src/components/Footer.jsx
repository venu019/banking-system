import React from "react";
import { Link } from "react-router-dom";

// --- DESIGN TOKENS (Consistent with Navbar) ---
const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    borderTop: '1px solid rgba(209, 213, 219, 0.4)'
};

const brandColors = {
    navy: '#012169',
    red: '#E31837'
};

export default function Footer() {
  return (
    // --- CHANGE: Reduced top padding from pt-4 to pt-3 ---
    <footer className="mt-5 pt-3" style={glassmorphismStyle}>
      <div className="container">
        <div className="row">

          {/* Brand and Social Links */}
          <div className="col-12 col-lg-4 mb-4 mb-lg-0">
            <h5 className="fw-bold" style={{ color: brandColors.red }}>NeoBank</h5>
            <p className="mb-2" style={{ color: brandColors.navy }}>
              Secure banking made simple and accessible.
            </p>
            <div className="d-flex gap-3 fs-5">
              <a href="#!" aria-label="Twitter" style={{ color: brandColors.navy }}><i className="bi bi-twitter"></i></a>
              <a href="#!" aria-label="LinkedIn" style={{ color: brandColors.navy }}><i className="bi bi-linkedin"></i></a>
              <a href="#!" aria-label="GitHub" style={{ color: brandColors.navy }}><i className="bi bi-github"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-semibold" style={{ color: brandColors.red }}>Links</h6>
            <ul className="list-unstyled mb-0">
              {/* --- CHANGE: Reduced margin-bottom from mb-2 to mb-1 --- */}
              <li className="mb-1"><Link to="/dashboard" className="text-decoration-none" style={{ color: brandColors.navy }}>Home</Link></li>
              <li className="mb-1"><Link to="/accounts" className="text-decoration-none" style={{ color: brandColors.navy }}>Accounts</Link></li>
              <li className="mb-1"><Link to="/support" className="text-decoration-none" style={{ color: brandColors.navy }}>Support</Link></li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div className="col-6 col-lg-2">
              <h6 className="fw-semibold" style={{ color: brandColors.red }}>Legal</h6>
              <ul className="list-unstyled mb-0">
                <li className="mb-1"><Link to="/privacy" className="text-decoration-none" style={{ color: brandColors.navy }}>Privacy</Link></li>
                <li className="mb-1"><Link to="/terms" className="text-decoration-none" style={{ color: brandColors.navy }}>Terms</Link></li>
                <li className="mb-1"><Link to="/security" className="text-decoration-none" style={{ color: brandColors.navy }}>Security</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-12 col-lg-4 mt-4 mt-lg-0">
            <h6 className="fw-semibold" style={{ color: brandColors.red }}>Contact Us</h6>
            <ul className="list-unstyled mb-0" style={{ color: brandColors.navy }}>
              <li className="mb-1 d-flex align-items-center">
                <i className="bi bi-envelope me-2"></i>
                <a href="mailto:support@neobank.com" className="text-decoration-none" style={{ color: brandColors.navy }}>support@neobank.com</a>
              </li>
              <li className="d-flex align-items-center">
                <i className="bi bi-geo-alt me-2"></i> Bengaluru, IN
              </li>
            </ul>
          </div>
        </div>

        {/* --- CHANGE: Reduced margin from my-4 to my-3 --- */}
        <hr className="my-3" style={{ borderColor: "rgba(1, 33, 105, 0.2)" }} />

        {/* --- CHANGE: Reduced bottom padding from pb-4 to pb-3 --- */}
        <div className="d-flex align-items-center justify-content-center pb-3">
          <small style={{ color: brandColors.navy }}>
            &copy; {new Date().getFullYear()} NeoBank. All rights reserved.
          </small>
        </div>
      </div>
    </footer>
  );
}
