import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function AppNavbar() {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{ backgroundColor: "#000080" }}
    >
      <div className="container-fluid">
        <Link className="navbar-brand fw-semibold" to="/">
          NeoBank
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink end to="/dashboard" className="nav-link">
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/accounts" className="nav-link">
                My Accounts
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/pay" className="nav-link">
                Pay
              </NavLink>
            </li>

            {/* Services dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#!"
                id="servicesDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Services
              </a>
              <ul
                className="dropdown-menu dropdown-menu-dark"
                aria-labelledby="servicesDropdown"
              >
                <li>
                  <NavLink to="/services/loans" className="dropdown-item">
                    Loans
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/services/cards" className="dropdown-item">
                    Cards
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/services/transactions" className="dropdown-item">
                    Transactions
                  </NavLink>
                </li>
              </ul>
            </li>
          </ul>

          {/* Right-side actions (optional) */}
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/login" className="nav-link">
                Logout
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
