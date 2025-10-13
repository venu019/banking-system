import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-5 pt-4" style={{ backgroundColor: "#0d234f", color: "#cfd8ff" }}>
      <div className="container">
        <div className="row gy-4">
          {/* Brand and blurb */}
          <div className="col-12 col-md-4">
            <h5 className="mb-3" style={{ color: "#fff" }}>NeoBank</h5>
            <p className="mb-3">
              Secure banking made simple. Manage accounts, pay instantly, and track loans and cards with ease.
            </p>
            <div className="d-flex gap-3">
              <a href="#!" aria-label="Twitter" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#!" aria-label="LinkedIn" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="#!" aria-label="GitHub" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                <i className="bi bi-github"></i>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-6 col-md-2">
            <h6 className="mb-3" style={{ color: "#fff" }}>Quick Links</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link to="/" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/accounts" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  My Accounts
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/pay" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Pay / Transfer
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/transactions" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Transactions
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="col-6 col-md-3">
            <h6 className="mb-3" style={{ color: "#fff" }}>Services</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link to="/services/loans" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Loans
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/services/cards" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Cards
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/accounts/statements" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Statements
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/support" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-12 col-md-3">
            <h6 className="mb-3" style={{ color: "#fff" }}>Contact</h6>
            <ul className="list-unstyled mb-3">
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i> support@neobank.com
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i> +91 80-1234-5678
              </li>
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i> Bengaluru, IN
              </li>
            </ul>
            <div className="d-flex gap-2">
              <Link to="/privacy" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                Privacy
              </Link>
              <span>·</span>
              <Link to="/terms" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                Terms
              </Link>
              <span>·</span>
              <Link to="/security" className="text-decoration-none" style={{ color: "#cfd8ff" }}>
                Security
              </Link>
            </div>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: "rgba(255,255,255,.15)" }} />

        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between pb-4">
          <small className="mb-2 mb-md-0" style={{ color: "#cfd8ff" }}>
            © {new Date().getFullYear()} NeoBank. All rights reserved.
          </small>
          <small className="text-muted">
            Made with Bootstrap 5 · Theme color: Navy
          </small>
        </div>
      </div>
    </footer>
  );
}
