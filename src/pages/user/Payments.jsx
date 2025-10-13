import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const NAVY = "#000080";

function Payment() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Data
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);

  // Form state
  const [sourceType, setSourceType] = useState("ACCOUNT"); // ACCOUNT | DEBIT_CARD | CREDIT_CARD
  const [sourceAccountId, setSourceAccountId] = useState(""); // source account id when ACCOUNT
  const [sourceCardId, setSourceCardId] = useState(""); // source card id for cards
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("TRANSFER"); // TRANSFER | UPI | EXTERNAL
  const [merchantOrPayee, setMerchantOrPayee] = useState(""); // UPI ID or payee/merchant
  const [reference, setReference] = useState("");
  const [destIfsc, setDestIfsc] = useState("");
  const [destAcc, setDestAcc] = useState("");

  // Storage keys
  const accKey = useMemo(() => (user?.email ? "bank_accounts_" + user.email : null), [user]);
  const reqKey = useMemo(() => (user?.email ? "card_requests_" + user.email : null), [user]);
  const txKey = useMemo(() => (user?.email ? "transactions_" + user.email : null), [user]);

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
    const accs = JSON.parse(localStorage.getItem(accKey) || "[]");
    setAccounts(accs);
    if (accs.length && !sourceAccountId) {
      setSourceAccountId(accs[0].id);
    }
  }, [accKey]); // eslint-disable-line

  useEffect(() => {
    if (!reqKey) return;
    const reqs = JSON.parse(localStorage.getItem(reqKey) || "[]");
    // Show only approved/issued for spending
    const usable = reqs.filter((r) => ["APPROVED", "ISSUED"].includes(r.status));
    setCards(usable);
    if (usable.length && !sourceCardId) {
      setSourceCardId(usable[0].id);
    }
  }, [reqKey]); // eslint-disable-line

  const persistAccounts = (list) => {
    if (!accKey) return;
    localStorage.setItem(accKey, JSON.stringify(list));
    setAccounts(list);
  };

  const persistTransactions = (list) => {
    if (!txKey) return;
    localStorage.setItem(txKey, JSON.stringify(list));
  };

  const addTransaction = (tx) => {
    const list = JSON.parse(localStorage.getItem(txKey) || "[]");
    list.unshift(tx);
    persistTransactions(list);
  };

  const updateAccountBalance = (accountId, delta) => {
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) return;
    const copy = [...accounts];
    copy[idx] = {
      ...copy[idx],
      balance: Number((Number(copy[idx].balance || 0) + Number(delta)).toFixed(2)),
    };
    persistAccounts(copy);
  };

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === sourceAccountId),
    [accounts, sourceAccountId]
  );

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === sourceCardId),
    [cards, sourceCardId]
  );

  const canSpendFromAccount = () => {
    if (!selectedAccount) return false;
    const val = Number(amount);
    if (Number.isNaN(val) || val <= 0) return false;
    return selectedAccount.balance >= val;
  };

  const submitPayment = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (Number.isNaN(val) || val <= 0) {
      return alert("Enter a valid positive amount");
    }

    // Basic validations by purpose
    if (purpose === "UPI") {
      if (!merchantOrPayee.trim()) return alert("Enter UPI ID or payee");
    } else if (purpose === "EXTERNAL") {
      if (!destIfsc.trim() || !destAcc.trim()) return alert("Enter destination IFSC and account");
    } else if (purpose === "TRANSFER") {
      if (!merchantOrPayee.trim()) {
        // Optional internal note as payee, not mandatory
      }
    }

    const now = new Date().toISOString();

    // Source handling
    if (sourceType === "ACCOUNT") {
      if (!selectedAccount) return alert("Select a source account");
      if (!canSpendFromAccount()) return alert("Insufficient balance in source account");

      // Deduct from account
      updateAccountBalance(selectedAccount.id, -val);

      // Record transaction
      const tx = {
        id: crypto.randomUUID(),
        source: "PAY",
        title:
          purpose === "UPI"
            ? `UPI payment to ${merchantOrPayee}`
            : purpose === "EXTERNAL"
            ? `Bank transfer to ${destAcc} (${destIfsc})`
            : `Transfer: ${merchantOrPayee || "Payment"}`,
        amount: -val, // debit from bank account
        dateISO: now,
        accountNumber: selectedAccount.accountNumber,
        meta: {
          reference: reference || undefined,
          merchant: purpose === "UPI" ? merchantOrPayee : undefined,
          destIfsc: purpose === "EXTERNAL" ? destIfsc : undefined,
          destAcc: purpose === "EXTERNAL" ? destAcc : undefined,
          purpose,
        },
      };
      addTransaction(tx);
      alert("Payment successful from bank account");
    } else if (sourceType === "DEBIT_CARD") {
      if (!selectedCard) return alert("Select a debit card");
      // For a debit card, spending also reduces the underlying linked bank account.
      // If your stored card requests include linkedAccount, use it:
      const linkedAccNum = selectedCard?.linkedAccount?.accountNumber;
      const linkedAcc = accounts.find((a) => a.accountNumber === linkedAccNum) || selectedAccount;

      if (!linkedAcc) return alert("No linked account found for this debit card");
      if (Number(linkedAcc.balance || 0) < val) return alert("Insufficient balance in linked account");

      updateAccountBalance(linkedAcc.id, -val);

      const last4 = selectedCard?.linkedAccount?.accountNumber
        ? (selectedCard?.linkedAccount?.accountNumber + "").slice(-4)
        : selectedCard?.preferences?.cardLast4 || "";

      const tx = {
        id: crypto.randomUUID(),
        source: "DEBIT_CARD",
        title: `Debit card spend ${merchantOrPayee ? "@" + merchantOrPayee : ""}`,
        amount: -val, // debit from bank via debit card
        dateISO: now,
        accountNumber: linkedAcc.accountNumber,
        meta: {
          merchant: merchantOrPayee || undefined,
          cardLast4: last4 || undefined,
          reference: reference || undefined,
          purpose,
        },
      };
      addTransaction(tx);
      alert("Payment successful with debit card");
    } else if (sourceType === "CREDIT_CARD") {
      if (!selectedCard) return alert("Select a credit card");
      // For a credit card spend, bank account is not deducted immediately.
      // We only record a CREDIT_CARD transaction for visibility.
      const last4 =
        selectedCard?.linkedAccount?.accountNumber
          ? (selectedCard?.linkedAccount?.accountNumber + "").slice(-4)
          : selectedCard?.preferences?.cardLast4 || "";

      const tx = {
        id: crypto.randomUUID(),
        source: "CREDIT_CARD",
        title: `Credit card spend ${merchantOrPayee ? "@" + merchantOrPayee : ""}`,
        amount: 0 - val, // negative to show spend; not tied to a bank account balance
        dateISO: now,
        accountNumber: "", // not deducted from bank now
        meta: {
          merchant: merchantOrPayee || undefined,
          cardLast4: last4 || undefined,
          reference: reference || undefined,
          purpose,
        },
      };
      addTransaction(tx);
      alert("Credit card spend recorded (bank balance unaffected now). Settle later via card bill payment.");
    }

    // Reset key fields
    setAmount("");
    setMerchantOrPayee("");
    setReference("");
    setDestIfsc("");
    setDestAcc("");
  };

  if (!user) return null;

  return (
    <div>
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container">
          <div className="navbar-brand">Make a Payment</div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/dashboard")}>
              Back
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <div className="row g-3">
          {/* Source selector */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Source</h5>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Source Type</label>
                    <select
                      className="form-select"
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                    >
                      <option value="ACCOUNT">Bank Account</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                    </select>
                  </div>

                  {sourceType === "ACCOUNT" && (
                    <div className="col-md-8">
                      <label className="form-label">Select Account</label>
                      {accounts.length ? (
                        <select
                          className="form-select"
                          value={sourceAccountId}
                          onChange={(e) => setSourceAccountId(e.target.value)}
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.type || "SAVINGS"} · {a.accountNumber} · {a.ifsc} · ₹{Number(a.balance).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="alert alert-warning py-2">
                          No accounts found.{" "}
                          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => navigate("/accounts")}>
                            Create an account
                          </button>
                        </div>
                      )}
                      <small className="text-muted">
                        Available balance must be ≥ amount for account-based payments.
                      </small>
                    </div>
                  )}

                  {(sourceType === "DEBIT_CARD" || sourceType === "CREDIT_CARD") && (
                    <div className="col-md-8">
                      <label className="form-label">Select Card</label>
                      {cards.length ? (
                        <select
                          className="form-select"
                          value={sourceCardId}
                          onChange={(e) => setSourceCardId(e.target.value)}
                        >
                          {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.type} · {c.brand} {c.preferences?.cardLast4 ? `· **** ${c.preferences.cardLast4}` : ""} · {c.status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="alert alert-warning py-2">
                          No approved/issued cards found.{" "}
                          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => navigate("/services/cards/request")}>
                            Request a card
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Destination and amount */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Destination</h5>

                <form onSubmit={submitPayment} className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Payment Type</label>
                    <select className="form-select" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                      <option value="TRANSFER">Internal Transfer</option>
                      <option value="UPI">UPI / Merchant</option>
                      <option value="EXTERNAL">External Bank (IFSC)</option>
                    </select>
                  </div>

                  {purpose === "UPI" && (
                    <div className="col-md-8">
                      <label className="form-label">UPI ID or Merchant</label>
                      <input
                        className="form-control"
                        placeholder="e.g., name@bank or Merchant Name"
                        value={merchantOrPayee}
                        onChange={(e) => setMerchantOrPayee(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {purpose === "TRANSFER" && (
                    <div className="col-md-8">
                      <label className="form-label">Note / Payee (optional)</label>
                      <input
                        className="form-control"
                        placeholder="Optional internal note or payee"
                        value={merchantOrPayee}
                        onChange={(e) => setMerchantOrPayee(e.target.value)}
                      />
                    </div>
                  )}

                  {purpose === "EXTERNAL" && (
                    <>
                      <div className="col-md-4">
                        <label className="form-label">Destination IFSC</label>
                        <input
                          className="form-control"
                          placeholder="e.g., BANK0001234"
                          value={destIfsc}
                          onChange={(e) => setDestIfsc(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Destination Account</label>
                        <input
                          className="form-control"
                          placeholder="Account Number"
                          value={destAcc}
                          onChange={(e) => setDestAcc(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="col-md-4">
                    <label className="form-label">Amount (₹)</label>
                    <input
                      className="form-control"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-8">
                    <label className="form-label">Reference (optional)</label>
                    <input
                      className="form-control"
                      placeholder="e.g., UPI Ref, Order ID"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>

                  <div className="col-12 d-flex justify-content-end">
                    <button type="submit" className="btn text-white" style={{ backgroundColor: NAVY }}>
                      Pay Now
                    </button>
                  </div>
                </form>

                {/* Spending tip */}
                <div className="mt-3">
                  <small className="text-muted">
                    Bank Account and Debit Card spends reduce account balance immediately. Credit Card spends are recorded for later settlement.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Recent payments summary */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-2">Recent Payments</h5>
                <p className="text-muted mb-3">Latest 5 entries from the unified ledger.</p>
                <RecentList email={user?.email} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function RecentList({ email }) {
  if (!email) return null;
  const list = JSON.parse(localStorage.getItem("transactions_" + email) || "[]");
  const items = list.slice(0, 5);

  if (!items.length) return <p className="mb-0">No recent payments</p>;

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            <th>Title</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Source</th>
            <th>Account</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td className="text-truncate" style={{ maxWidth: 260 }} title={t.title}>
                {t.title}
              </td>
              <td className={t.amount >= 0 ? "text-success" : "text-danger"}>
                {t.amount >= 0 ? "+" : ""}₹{Number(t.amount).toFixed(2)}
              </td>
              <td>{new Date(t.dateISO || t.date || "").toLocaleString()}</td>
              <td>
                <span className="badge bg-light text-dark border">
                  {t.source?.replaceAll("_", " ") || "PAY"}
                </span>
              </td>
              <td>{t.accountNumber || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Payment;
