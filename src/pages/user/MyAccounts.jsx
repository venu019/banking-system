import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyAccounts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchCity, setBranchCity] = useState("");
  const [branchState, setBranchState] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("currentUser"));
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
    const key = "bank_accounts_" + u.email;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setAccounts(stored);
  }, [navigate]);

  const saveAccounts = (list) => {
    const key = "bank_accounts_" + user.email;
    localStorage.setItem(key, JSON.stringify(list));
    setAccounts(list);
  };

  // Helpers to generate accountNumber and IFSC
  const generateAccountNumber = () => {
    // 12-digit numeric string
    let s = "";
    for (let i = 0; i < 12; i++) {
      s += Math.floor(Math.random() * 10);
    }
    return s;
  };

  const computeIFSC = (branch) => {
    // Simple IFSC pattern: BANK0 + BRANCHCODE (max 6 chars alnum uppercased)
    const sanitized = (branch || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return `BANK0${sanitized.padEnd(6, "X")}`;
  };

  const openingBalance = useMemo(() => 2000, []);

  const requestAccount = () => {
    setShowForm(true);
    if (user?.name && !fullName) setFullName(user.name);
  };

  const createAccount = (e) => {
    e.preventDefault();

    // Minimal client-side validation
    if (!fullName.trim()) return alert("Enter full name");
    if (!branchCode.trim()) return alert("Enter branch code");
    if (!branchCity.trim()) return alert("Enter branch city");
    if (!branchState.trim()) return alert("Enter branch state");
    if (!addressLine1.trim()) return alert("Enter address line 1");
    if (!pincode.trim()) return alert("Enter pincode");

    const accountNumber = generateAccountNumber();
    const ifsc = computeIFSC(branchCode);

    const newAccount = {
      id: crypto.randomUUID(),
      holderName: fullName.trim(),
      type: "SAVINGS",
      accountNumber,
      ifsc,
      branch: {
        code: branchCode.trim(),
        city: branchCity.trim(),
        state: branchState.trim(),
      },
      address: {
        line1: addressLine1.trim(),
        line2: addressLine2.trim(),
        pincode: pincode.trim(),
      },
      balance: openingBalance,
      currency: "INR",
      status: "ACTIVE",
      openedAt: new Date().toISOString(),
    };

    const list = [newAccount, ...accounts];
    saveAccounts(list);

    // Reset form and hide
    setShowForm(false);
    setFullName(user?.name || "");
    setBranchCode("");
    setBranchCity("");
    setBranchState("");
    setAddressLine1("");
    setAddressLine2("");
    setPincode("");

    alert(`Account created!\nNumber: ${accountNumber}\nIFSC: ${ifsc}`);
  };

  const viewStatements = (acc) => {
    navigate(`/accounts/statements?acc=${acc.accountNumber}`);
  };

  const viewTransactions = (acc) => {
    navigate(`/transactions?acc=${acc.accountNumber}`);
  };

  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">My Accounts</h2>
        {!showForm && (
          <button
            className="btn text-white"
            style={{ backgroundColor: "#000080" }}
            onClick={requestAccount}
          >
            Request New Account
          </button>
        )}
      </div>

      {/* Request / Create Account Form */}
      {showForm && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Request New Account</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
            <p className="text-muted mt-2 mb-3">
              Provide branch/location and address details. A savings account will be created with a default balance of ₹2000.
            </p>

            <form onSubmit={createAccount} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Account holder name"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Branch Code</label>
                <input
                  className="form-control"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="e.g., BLR001"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Branch City</label>
                <input
                  className="form-control"
                  value={branchCity}
                  onChange={(e) => setBranchCity(e.target.value)}
                  placeholder="City"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Branch State</label>
                <input
                  className="form-control"
                  value={branchState}
                  onChange={(e) => setBranchState(e.target.value)}
                  placeholder="State"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Pincode</label>
                <input
                  className="form-control"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g., 560001"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Address Line 1</label>
                <input
                  className="form-control"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street, locality"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Address Line 2</label>
                <input
                  className="form-control"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, landmark (optional)"
                />
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button type="submit" className="btn text-white" style={{ backgroundColor: "#000080" }}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts list */}
{accounts.length === 0 ? (
  <div className="card border-0 shadow-sm">
    <div className="card-body">
      <p className="mb-3">No accounts yet.</p>
      <button
        className="btn text-white"
        style={{ backgroundColor: "#000080" }}
        onClick={requestAccount}
      >
        Request New Account
      </button>
    </div>
  </div>
) : (
  <div className="row g-3">
    {accounts.map((acc) => (
      <div className="col-12" key={acc.id}>
        {/* Slightly taller card (~10-15% more than before), no scroll */}
        <div
          className="card border-0 shadow-lg position-relative"
          style={{ height: 270, overflow: "hidden" }}
        >


          {/* Header area with icon + status */}
          <div className="d-flex align-items-center justify-content-between px-3 pt-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: "#e8ecff",
                  color: "#000080",
                }}
              >
                {/* If using Bootstrap Icons, include the CSS in index.html */}
                <i className="bi bi-bank2" />
              </div>
              <div>
                <h6 className="mb-0">{acc.type} Account</h6>
                <small className="text-muted">
                  {acc.branch.city}, {acc.branch.state}
                </small>
              </div>
            </div>

            <span
              className={`badge ${
                acc.status === "ACTIVE" ? "bg-success" : "bg-secondary"
              }`}
            >
              {acc.status}
            </span>
          </div>

          {/* Body content, no overflow scroll */}
          <div className="px-3 pb-3 pt-2">
            {/* Two-column info grid */}
            <div className="row g-3">
              <div className="col-sm-4">
                <small className="text-muted d-block">Account Number</small>
                <div
                  className="fw-semibold text-truncate"
                  title={acc.accountNumber}
                >
                  {acc.accountNumber}
                </div>
              </div>
              <div className="col-sm-4">
                <small className="text-muted d-block">IFSC</small>
                <div className="fw-semibold text-truncate" title={acc.ifsc}>
                  {acc.ifsc}
                </div>
              </div>

              <div className="col-sm-4">
                <small className="text-muted d-block">Branch Code</small>
                <div className="text-truncate" title={acc.branch.code}>
                  {acc.branch.code}
                </div>
              </div>

              <div className="col-sm-4">
                <small className="text-muted d-block">Opened</small>
                <div
                  className="text-truncate"
                  title={new Date(acc.openedAt).toLocaleString()}
                >
                  {new Date(acc.openedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="col-8">
                <small className="text-muted d-block">Address</small>
                <div
                  className="text-truncate"
                  title={`${acc.address.line1}${
                    acc.address.line2 ? `, ${acc.address.line2}` : ""
                  }, ${acc.address.pincode}`}
                >
                  {acc.address.line1}
                  {acc.address.line2 ? `, ${acc.address.line2}` : ""},{" "}
                  {acc.address.pincode}
                </div>
              </div>
            </div>

            {/* Balance + actions row */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mt-3">
              <div>
                <small className="text-muted d-block">Current Balance</small>
                <div
                  className="fw-bold"
                  style={{ fontSize: 28, color: "#000080" }}
                >
                  ₹ {Number(acc.balance).toFixed(2)}
                </div>
              </div>

              <div className="d-flex gap-2 mt-2 mt-md-0">
                <button
                  className="btn btn-sm btn-outline-primary"
                  style={{ borderColor: "#000080", color: "#000080" }}
                  onClick={() => viewTransactions(acc)}
                >
                  View Transactions
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  style={{ borderColor: "#000080", color: "#000080" }}
                  onClick={() => viewStatements(acc)}
                >
                  Statements
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

    </div>
  );
}

export default MyAccounts;
