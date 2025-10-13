import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const NAVY = "#000080";

// Unified transaction schema suggestion:
// {
//   id,                        // uuid
//   source: 'PAY'|'DEBIT_CARD'|'CREDIT_CARD'|'TRANSFER'|'ADJUSTMENT',
//   title,                     // string
//   amount,                    // number (+ credit, - debit)
//   dateISO,                   // ISO string date
//   accountNumber,             // optional, link to specific account
//   meta: {                    // optional metadata
//     cardLast4, merchant, reference, category
//   }
// }

function Transactions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [accounts, setAccounts] = useState([]); // optional: from bank_accounts_<email>

  // Add Transaction modal state (for manual entries)
  const [showAdd, setShowAdd] = useState(false);
  const [txSource, setTxSource] = useState("PAY"); // PAY | DEBIT_CARD | CREDIT_CARD | TRANSFER | ADJUSTMENT
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txAccountNumber, setTxAccountNumber] = useState("");
  const [txMerchant, setTxMerchant] = useState("");
  const [txCardLast4, setTxCardLast4] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("currentUser"));
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);

    // Load unified transactions
    const tkey = "transactions_" + u.email;
    const tx = JSON.parse(localStorage.getItem(tkey) || "[]");
    setTransactions(tx);

    // Optional: load accounts for linking and live balance updates
    const akey = "bank_accounts_" + u.email;
    const accs = JSON.parse(localStorage.getItem(akey) || "[]");
    setAccounts(accs);
  }, [navigate]);

  const tkey = useMemo(() => (user?.email ? "transactions_" + user.email : null), [user]);
  const akey = useMemo(() => (user?.email ? "bank_accounts_" + user.email : null), [user]);

  const persistTransactions = (list) => {
    if (!tkey) return;
    localStorage.setItem(tkey, JSON.stringify(list));
    setTransactions(list);
  };

  const persistAccounts = (list) => {
    if (!akey) return;
    localStorage.setItem(akey, JSON.stringify(list));
    setAccounts(list);
  };

  const adjustAccountBalance = (accountNumber, delta) => {
    if (!accountNumber || !accounts?.length) return;
    const idx = accounts.findIndex((a) => a.accountNumber === accountNumber);
    if (idx === -1) return;
    const copy = [...accounts];
    copy[idx] = {
      ...copy[idx],
      balance: Number((Number(copy[idx].balance || 0) + Number(delta)).toFixed(2)),
    };
    persistAccounts(copy);
  };

  const addTx = (tx) => {
    // tx.amount: + credit to account, - debit from account
    const list = [tx, ...transactions];
    persistTransactions(list);

    // If linked to an account, adjust its balance
    adjustAccountBalance(tx.accountNumber, tx.amount);
  };

  const removeTx = (id) => {
    const found = transactions.find((t) => t.id === id);
    const list = transactions.filter((t) => t.id !== id);
    persistTransactions(list);

    // Reverse balance impact if linked
    if (found?.accountNumber) {
      adjustAccountBalance(found.accountNumber, -found.amount);
    }
  };

  const clearAll = () => {
    if (!user) return;
    if (!window.confirm("Clear all transactions? This will not change account balances retroactively.")) return;
    persistTransactions([]);
  };

  const filtered = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "credit") return t.amount > 0;
    if (filter === "debit") return t.amount <= 0;
    if (filter === "debit_card") return t.source === "DEBIT_CARD";
    if (filter === "credit_card") return t.source === "CREDIT_CARD";
    if (filter === "transfer") return t.source === "TRANSFER";
    if (filter === "adjustment") return t.source === "ADJUSTMENT";
    return true;
  });

  const creditCardPayments = transactions.filter((t) => t.source === "CREDIT_CARD");

  const onSubmitAdd = (e) => {
    e.preventDefault();
    if (!txTitle.trim()) return alert("Enter title");
    if (!txAmount) return alert("Enter amount");
    const val = Number(txAmount);
    if (Number.isNaN(val)) return alert("Amount must be a number");

    const now = new Date().toISOString();
    const tx = {
      id: crypto.randomUUID(),
      source: txSource,
      title: txTitle.trim(),
      amount: val, // positive = credit to account, negative = debit from account
      dateISO: now,
      accountNumber: txAccountNumber || "", // if empty, treat as global/not-linked
      meta: {
        merchant: txMerchant || undefined,
        cardLast4: txCardLast4 || undefined,
      },
    };
    addTx(tx);

    // Reset modal
    setShowAdd(false);
    setTxSource("PAY");
    setTxTitle("");
    setTxAmount("");
    setTxAccountNumber("");
    setTxMerchant("");
    setTxCardLast4("");
  };

  return (
    <div>
      {/* Top bar */}
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container">
          <div className="navbar-brand">Transactions</div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/dashboard")}>
              Back
            </button>
            <button
              className="btn btn-sm text-white"
              style={{ backgroundColor: NAVY }}
              onClick={() => setShowAdd(true)}
            >
              Add Entry
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Filters row */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <select className="form-select w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
            <option value="debit_card">Debit Card</option>
            <option value="credit_card">Credit Card</option>
            <option value="transfer">Transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>
          <button className="btn btn-danger" onClick={clearAll}>
            Clear All
          </button>
        </div>

        {/* Credit Card payments quick view */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h5 className="card-title mb-2">Credit Card Payments</h5>
            {creditCardPayments.length === 0 ? (
              <p className="mb-0 text-muted">No credit card payments recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Linked Account</th>
                      <th>Card</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditCardPayments.map((t) => (
                      <tr key={t.id}>
                        <td className="text-truncate" style={{ maxWidth: 240 }} title={t.title}>
                          {t.title}
                        </td>
                        <td className={t.amount >= 0 ? "text-success" : "text-danger"}>
                          {t.amount >= 0 ? "+" : ""}₹{Number(t.amount).toFixed(2)}
                        </td>
                        <td>{new Date(t.dateISO).toLocaleString()}</td>
                        <td>{t.accountNumber || "—"}</td>
                        <td>{t.meta?.cardLast4 ? `**** ${t.meta.cardLast4}` : "—"}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeTx(t.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Main ledger */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">All Transactions</h5>
              <small className="text-muted">Latest first</small>
            </div>
            <hr />
            {filtered.length === 0 ? (
              <p className="mb-0">No transactions</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 200 }}>Title</th>
                      <th style={{ minWidth: 120 }}>Amount</th>
                      <th style={{ minWidth: 160 }}>Date</th>
                      <th style={{ minWidth: 140 }}>Source</th>
                      <th style={{ minWidth: 180 }}>Linked Account</th>
                      <th style={{ minWidth: 180 }}>Details</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id}>
                        <td className="text-truncate" title={t.title}>{t.title}</td>
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
                        <td className="text-truncate" title={`${t.meta?.merchant || ""} ${t.meta?.reference || ""}`.trim()}>
                          {t.meta?.merchant ? `@ ${t.meta.merchant}` : ""}
                          {t.meta?.cardLast4 ? (t.meta?.merchant ? " · " : "") + `**** ${t.meta.cardLast4}` : ""}
                          {t.meta?.reference ? (t.meta?.merchant || t.meta?.cardLast4 ? " · " : "") + t.meta.reference : ""}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeTx(t.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal (simple inline modal) */}
      {showAdd && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,.45)", zIndex: 1060 }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="card shadow position-absolute top-50 start-50 translate-middle"
            style={{ width: 560, maxWidth: "96%", border: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Add Transaction</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowAdd(false)}>
                  Close
                </button>
              </div>
              <form onSubmit={onSubmitAdd} className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Source</label>
                  <select className="form-select" value={txSource} onChange={(e) => setTxSource(e.target.value)}>
                    <option value="PAY">Payment</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control"
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    placeholder="e.g., Grocery Store / Salary / UPI Ref ..."
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-control"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Use negative for debits"
                    required
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Linked Account (optional)</label>
                  {accounts?.length ? (
                    <select
                      className="form-select"
                      value={txAccountNumber}
                      onChange={(e) => setTxAccountNumber(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.accountNumber}>
                          {a.type || "SAVINGS"} · {a.accountNumber} · {a.ifsc}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-control" value="" disabled placeholder="No accounts available" />
                  )}
                </div>

                {/* Optional metadata */}
                <div className="col-md-6">
                  <label className="form-label">Merchant / To / From (optional)</label>
                  <input
                    className="form-control"
                    value={txMerchant}
                    onChange={(e) => setTxMerchant(e.target.value)}
                    placeholder="Merchant or payee"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Card Last 4 (optional)</label>
                  <input
                    className="form-control"
                    value={txCardLast4}
                    onChange={(e) => setTxCardLast4(e.target.value)}
                    placeholder="e.g., 1234"
                  />
                </div>

                <div className="col-12 d-flex justify-content-end">
                  <button type="submit" className="btn text-white" style={{ backgroundColor: NAVY }}>
                    Save Entry
                  </button>
                </div>
              </form>

              <div className="mt-3">
                <small className="text-muted">
                  Tip: Use negative amount for spends (debits) and positive for income (credits). Link to an account to auto-adjust its balance.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
