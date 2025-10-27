import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [notif, setNotif] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get the full stored data object
    const storedData = JSON.parse(localStorage.getItem("user"));
    
    // 2. Check for the nested 'user' object for validation
    if (!storedData || !storedData.user) {
      navigate("/login");
      return;
    }
    
    // 3. Extract the actual user details
    const userDetails = storedData.user;
    setUser(userDetails);
    
    // 4. Use the email from the nested userDetails object
    const tx = JSON.parse(localStorage.getItem("transactions_" + userDetails.email) || "[]");
    setTransactions(tx);
    setNotif(JSON.parse(localStorage.getItem("notifications_" + userDetails.email) || "[]"));
    
    setIsLoading(false);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("jwtToken");
    navigate("/login");
  };

  const downloadPDF = () => {
    if (!user) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Transactions", 14, 20);
    let y = 30;
    const key = "transactions_" + user.email;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    stored.forEach((t, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${t.title} — ${t.amount >= 0 ? "+₹" + t.amount : "₹" + t.amount}`, 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`   ${t.date}`, 14, y);
      y += 10;
    });
    doc.save("transactions.pdf");
  };

  if (isLoading) {
    return <div className="text-center p-5">Loading Dashboard...</div>;
  }

  return (
    <div>
      <AppNavbar onLogout={logout} />
      <div className="container py-4">
        <div className="bg-light rounded-3 p-4 p-md-5 mb-4 border">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div>
              <h2 className="mb-1">
                Welcome back, <span style={{ color: "#000080" }}>{user.username}</span> 👋
              </h2>
              <p className="mb-0 text-muted">
                Manage accounts, pay quickly, and apply for financial products in one place.
              </p>
            </div>
            <div className="d-grid gap-2 d-md-flex">
              <button
                className="btn btn-outline-primary"
                style={{ borderColor: "#000080", color: "#000080" }}
                onClick={() => navigate("/profile/kyc")}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
        
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body">
            <h5 className="card-title">Quick Actions</h5>
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-3">
                <div role="button" className="card h-100 border-0 shadow-sm" onClick={() => navigate("/accounts")}>
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#e8ecff", color: "#000080" }}>
                      <i className="bi bi-wallet2"></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: "#000080" }}>Accounts</div>
                      <small className="text-muted">View balances & statements</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <div role="button" className="card h-100 border-0 shadow-sm" onClick={() => navigate("/pay")}>
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#000080", color: "#fff" }}>
                      <i className="bi bi-arrow-left-right"></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: "#000080" }}>Pay / Transfer</div>
                      <small className="text-muted">Send money & pay bills</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <div role="button" className="card h-100 border-0 shadow-sm" onClick={() => navigate("/services/cards")}>
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#e8ecff", color: "#000080" }}>
                      <i className="bi bi-credit-card-2-back"></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: "#000080" }}>Apply Card</div>
                      <small className="text-muted">Debit/credit applications</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <div role="button" className="card h-100 border-0 shadow-sm" onClick={() => navigate("/services/loans")}>
                  <div className="card-body d-flex align-items-center">
                    <div className="me-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#e8ecff", color: "#000080" }}>
                      <i className="bi bi-journal-richtext"></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: "#000080" }}>Apply Loan</div>
                      <small className="text-muted">Personal, home, and more</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Transactions</h5>
                  <div>
                    <button className="btn btn-info btn-sm me-2" onClick={downloadPDF}>Download PDF</button>
                    <button className="btn btn-sm text-white" style={{ backgroundColor: "#000080" }} onClick={() => navigate("/services/transactions")}>View All →</button>
                  </div>
                </div>
                <hr />
                {transactions.length === 0 ? <p className="mb-0">No transactions yet.</p> : transactions.slice(0, 5).map((t, idx) => (
                  <div className="d-flex justify-content-between align-items-center py-2" key={idx}>
                    <div><div className="fw-medium">{t.title}</div><small className="text-muted">{t.date}</small></div>
                    <div className={t.amount >= 0 ? "text-success" : "text-danger"}>{t.amount >= 0 ? "+" : ""}₹{t.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h5 className="card-title">Notifications</h5>
                <hr />
                {notif.length === 0 ? <p className="mb-0">No notifications</p> : <ul className="list-unstyled mb-0">{notif.map((n, i) => (<li className="mb-2" key={i}>{n}</li>))}</ul>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Dashboard;
