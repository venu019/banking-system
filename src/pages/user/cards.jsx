import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function CardRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Accounts and filtered accounts
  const [accounts, setAccounts] = useState([]);
  const [eligibleAccounts, setEligibleAccounts] = useState([]);

  // Existing requests list
  const [requests, setRequests] = useState([]);

  // Form visibility
  const [showForm, setShowForm] = useState(true);

  // Form fields
  const [cardType, setCardType] = useState("DEBIT"); // DEBIT | CREDIT
  const [brand, setBrand] = useState("VISA"); // VISA | MC | RUPAY
  const [linkedAccId, setLinkedAccId] = useState(""); // selected account id
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryLine1, setDeliveryLine1] = useState("");
  const [deliveryLine2, setDeliveryLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");

  // Optional preferences
  const [creditLimit, setCreditLimit] = useState(""); // For credit cards
  const [debitAtmDaily, setDebitAtmDaily] = useState(""); // For debit daily ATM
  const [debitPosDaily, setDebitPosDaily] = useState(""); // For debit POS

  // Storage keys
  const reqKey = useMemo(() => (user?.email ? "card_requests_" + user.email : null), [user]);
  const accKey = useMemo(() => (user?.email ? "bank_accounts_" + user.email : null), [user]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("currentUser"));
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);
  }, [navigate]);

  useEffect(() => {
    if (!accKey) return;
    const storedAccs = JSON.parse(localStorage.getItem(accKey) || "[]");
    setAccounts(storedAccs);
  }, [accKey]);

  useEffect(() => {
    if (!reqKey) return;
    const stored = JSON.parse(localStorage.getItem(reqKey) || "[]");
    setRequests(stored);
  }, [reqKey]);

  // Determine eligible accounts based on card type
  useEffect(() => {
    if (!accounts?.length) {
      setEligibleAccounts([]);
      return;
    }
    // Example rules:
    // - Debit cards: typically link to transactional (SAVINGS/CURRENT) accounts only
    // - Credit cards: allow selecting any account as billing reference (customize per need)
    const filtered =
      cardType === "DEBIT"
        ? accounts.filter((a) => ["SAVINGS", "CURRENT", "PRIMARY"].includes(a.type || "SAVINGS"))
        : accounts;
    setEligibleAccounts(filtered);

    // Reset linked account if current selection is no longer eligible
    if (linkedAccId && !filtered.find((a) => a.id === linkedAccId)) {
      setLinkedAccId("");
    }
  }, [accounts, cardType, linkedAccId]);

  const saveRequests = (list) => {
    if (!reqKey) return;
    localStorage.setItem(reqKey, JSON.stringify(list));
    setRequests(list);
  };

  const resetForm = () => {
    setCardType("DEBIT");
    setBrand("VISA");
    setLinkedAccId("");
    setFullName(user?.name || "");
    setPhone("");
    setDeliveryLine1("");
    setDeliveryLine2("");
    setCity("");
    setStateVal("");
    setPincode("");
    setCreditLimit("");
    setDebitAtmDaily("");
    setDebitPosDaily("");
  };

  const submitRequest = (e) => {
    e.preventDefault();

    // Minimal validations
    if (!linkedAccId) return alert("Please select an account to link this card to");
    if (!fullName.trim()) return alert("Enter full name");
    if (!phone.trim()) return alert("Enter phone number");
    if (!deliveryLine1.trim()) return alert("Enter delivery address line 1");
    if (!city.trim()) return alert("Enter city");
    if (!stateVal.trim()) return alert("Enter state");
    if (!pincode.trim()) return alert("Enter pincode");

    if (cardType === "CREDIT" && creditLimit && Number.isNaN(Number(creditLimit))) {
      return alert("Credit limit must be a number");
    }
    if (cardType === "DEBIT") {
      if (debitAtmDaily && Number.isNaN(Number(debitAtmDaily))) {
        return alert("ATM daily limit must be a number");
      }
      if (debitPosDaily && Number.isNaN(Number(debitPosDaily))) {
        return alert("POS daily limit must be a number");
      }
    }

    const acc = accounts.find((a) => a.id === linkedAccId);
    if (!acc) return alert("Selected account not found");

    const linkedAccount = {
      id: acc.id,
      type: acc.type,
      accountNumber: acc.accountNumber,
      ifsc: acc.ifsc,
      branchCode: acc.branch?.code,
    };

    // Create a new request
    const req = {
      id: crypto.randomUUID(),
      userEmail: user.email,
      holderName: fullName.trim(),
      phone: phone.trim(),
      type: cardType, // DEBIT or CREDIT
      brand,
      linkedAccount, // key association to user’s account
      status: "APPLIED", // Next: APPROVED/REJECTED/ISSUED
      requestedAt: new Date().toISOString(),
      deliveryAddress: {
        line1: deliveryLine1.trim(),
        line2: deliveryLine2.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        pincode: pincode.trim(),
      },
      preferences:
        cardType === "CREDIT"
          ? {
              requestedCreditLimit: creditLimit ? Number(creditLimit) : null,
            }
          : {
              dailyAtmLimit: debitAtmDaily ? Number(debitAtmDaily) : null,
              dailyPosLimit: debitPosDaily ? Number(debitPosDaily) : null,
            },
    };

    const updated = [req, ...requests];
    saveRequests(updated);
    alert("Card request submitted!");
    setShowForm(false);
    resetForm();
  };

  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Request a Card</h2>
        {!showForm && (
          <button
            className="btn text-white"
            style={{ backgroundColor: "#000080" }}
            onClick={() => {
              setShowForm(true);
              if (!fullName) setFullName(user?.name || "");
            }}
          >
            New Request
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Card Request Form</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
            <p className="text-muted mt-2 mb-3">
              Select a linked account, choose card type/brand, fill delivery details, then submit.
            </p>

            <form onSubmit={submitRequest} className="row g-3">
              {/* Linked Account */}
              <div className="col-12">
                <label className="form-label">Link to Account</label>
                {eligibleAccounts.length === 0 ? (
                  <div className="alert alert-warning py-2">
                    No eligible accounts found. Please create an account first.
                    <button
                      type="button"
                      className="btn btn-sm btn-link ms-2 p-0 align-baseline"
                      onClick={() => navigate("/accounts")}
                    >
                      Go to My Accounts
                    </button>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={linkedAccId}
                    onChange={(e) => setLinkedAccId(e.target.value)}
                    required
                  >
                    <option value="">Select an account</option>
                    {eligibleAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.type || "SAVINGS"} · {a.accountNumber} · {a.ifsc}
                      </option>
                    ))}
                  </select>
                )}
                <small className="text-muted">
                  For Debit cards, choose a transactional account (e.g., Savings). For Credit cards, this account is used for billing reference.
                </small>
              </div>

              {/* Card selection */}
              <div className="col-md-4">
                <label className="form-label">Card Type</label>
                <select
                  className="form-select"
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Brand</label>
                <select
                  className="form-select"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="VISA">VISA</option>
                  <option value="MC">Mastercard</option>
                  <option value="RUPAY">RuPay</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Full Name</label>
                <input
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name as on card"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  required
                />
              </div>

              {/* Credit-only preference */}
              {cardType === "CREDIT" && (
                <div className="col-md-4">
                  <label className="form-label">Requested Credit Limit (₹)</label>
                  <input
                    className="form-control"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="e.g., 100000"
                  />
                </div>
              )}

              {/* Debit-only preferences */}
              {cardType === "DEBIT" && (
                <>
                  <div className="col-md-4">
                    <label className="form-label">Daily ATM Limit (₹)</label>
                    <input
                      className="form-control"
                      value={debitAtmDaily}
                      onChange={(e) => setDebitAtmDaily(e.target.value)}
                      placeholder="e.g., 20000"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Daily POS Limit (₹)</label>
                    <input
                      className="form-control"
                      value={debitPosDaily}
                      onChange={(e) => setDebitPosDaily(e.target.value)}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </>
              )}

              {/* Delivery address */}
              <div className="col-md-6">
                <label className="form-label">Delivery Address Line 1</label>
                <input
                  className="form-control"
                  value={deliveryLine1}
                  onChange={(e) => setDeliveryLine1(e.target.value)}
                  placeholder="House/Flat, Street"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Delivery Address Line 2</label>
                <input
                  className="form-control"
                  value={deliveryLine2}
                  onChange={(e) => setDeliveryLine2(e.target.value)}
                  placeholder="Area, Landmark (optional)"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">State</label>
                <input
                  className="form-control"
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
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

              <div className="col-12 d-flex justify-content-end">
                <button type="submit" className="btn text-white" style={{ backgroundColor: "#000080" }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests list */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5 className="card-title mb-3">My Card Requests</h5>

          {requests.length === 0 ? (
            <p className="mb-0">No requests yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Linked Account</th>
                    <th>Limits</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.type}</td>
                      <td>{r.brand}</td>
                      <td>
                        <span className={`badge ${
                          r.status === "APPLIED"
                            ? "bg-warning"
                            : r.status === "APPROVED"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{new Date(r.requestedAt).toLocaleString()}</td>
                      <td>
                        {r.linkedAccount?.type || "—"} · {r.linkedAccount?.accountNumber || "—"} <br />
                        <small className="text-muted">IFSC: {r.linkedAccount?.ifsc || "—"}</small>
                      </td>
                      <td>
                        {r.type === "CREDIT"
                          ? (r.preferences?.requestedCreditLimit
                              ? `Credit Limit: ₹${r.preferences.requestedCreditLimit.toLocaleString()}`
                              : "—")
                          : `ATM: ${
                              r.preferences?.dailyAtmLimit
                                ? `₹${r.preferences.dailyAtmLimit.toLocaleString()}`
                                : "—"
                            }, POS: ${
                              r.preferences?.dailyPosLimit
                                ? `₹${r.preferences.dailyPosLimit.toLocaleString()}`
                                : "—"
                            }`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 d-flex gap-2">
            <button
              className="btn btn-outline-primary"
              style={{ borderColor: "#000080", color: "#000080" }}
              onClick={() => navigate("/accounts")}
            >
              Go to My Accounts
            </button>
            <button
              className="btn btn-outline-primary"
              style={{ borderColor: "#000080", color: "#000080" }}
              onClick={() => navigate("/services/cards")}
            >
              Manage Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardRequest;
