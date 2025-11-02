import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import 'bootstrap-icons/font/bootstrap-icons.css';

const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const CARDS_API_URL = 'http://localhost:9004/cards';
const BANKS_API_URL = 'http://localhost:9003/api/branches';
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send';

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
};

function CardApplication() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [bankMap, setBankMap] = useState(new Map());
  const [existingCards, setExistingCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cardType, setCardType] = useState("DEBIT");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("user"));
    if (!storedData?.user) { navigate("/login"); return; }

    const userDetails = storedData.user;
    setUser(userDetails);
    const token = storedData.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchInitialData = async () => {
      try {
        const [accountsRes, cardsRes, banksRes] = await Promise.all([
          axios.get(`${ACCOUNTS_API_URL}/user/${userDetails.id}`, { headers }),
          axios.get(`${CARDS_API_URL}/my-cards`, { headers }),
          axios.get(BANKS_API_URL, { headers })
        ]);

        setAccounts(accountsRes.data);
        setExistingCards(cardsRes.data);
        setBankMap(new Map(banksRes.data.map(bank => [bank.id, bank])));
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        alert("Could not load your data. Please ensure all services are running.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const cardsByAccount = useMemo(() => {
    const map = new Map();
    existingCards.forEach(card => {
      if (!map.has(card.accountId)) map.set(card.accountId, []);
      map.get(card.accountId).push(card);
    });
    return map;
  }, [existingCards]);

  const hasPendingForSelection = useMemo(() => {
    if (!linkedAccountId) return false;
    return existingCards.some(c =>
      c.accountId === Number(linkedAccountId) && c.cardType === cardType && c.status === 'PENDING_APPROVAL'
    );
  }, [existingCards, linkedAccountId, cardType]);

  const eligibleAccounts = useMemo(() => {
    return accounts.filter(account => 
      !existingCards.some(card =>
        card.accountId === account.id && card.cardType === cardType && (card.status === 'ACTIVE' || card.status === 'PENDING_APPROVAL')
      )
    );
  }, [accounts, existingCards, cardType]);

  const sendCardApplicationNotification = async (cardDetails, userDetails, token) => {
    const linkedAccount = accounts.find(acc => acc.id === cardDetails.accountId);
    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Card Application Received</h2>
        <p>Dear ${userDetails.username},</p>
        <p>We have successfully received your application for a new <strong>${cardDetails.cardType.toLowerCase()} card</strong>. Your request is now pending review by our administration team.</p>
        <h3>Application Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Card Type:</strong> ${cardDetails.cardType}</li>
          <li><strong>Linked Account:</strong> ${linkedAccount?.accountNo || 'N/A'}</li>
          ${cardDetails.cardType === 'CREDIT' ? `<li><strong>Requested Limit:</strong> ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cardDetails.limitAmount)}</li>` : ''}
        </ul>
        <p>You will receive another notification once your application has been approved. Thank you for banking with us!</p>
        <p>Best Regards,<br/>The NeoBank Team</p>
      </div>
    `;

    const notificationPayload = {
      to: userDetails.email,
      subject: `Your ${cardDetails.cardType} Card Application has been Received`,
      body: emailBody,
    };

    try {
      await axios.post(NOTIFICATION_API_URL, notificationPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      console.log("Card application notification sent successfully.");
    } catch (error) {
      console.error("Failed to send card application notification:", error.response?.data || error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!linkedAccountId) return alert("Please select an account to link the card to.");
    if (cardType === 'CREDIT' && (!limitAmount || limitAmount <= 0)) {
      return alert("Please enter a valid requested credit limit.");
    }
    if (hasPendingForSelection) {
      return alert("An active or pending card of this type already exists for the selected account.");
    }

    const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
    const payload = {
      accountId: linkedAccountId,
      cardType: cardType,
      limitAmount: cardType === 'CREDIT' ? parseFloat(limitAmount) : 0,
    };

    try {
      const response = await axios.post(`${CARDS_API_URL}/apply`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      const newCardApplication = response.data;
      setExistingCards([newCardApplication, ...existingCards]);
      await sendCardApplicationNotification(newCardApplication, user, token);
      alert(`Card application submitted successfully! Your request is pending admin approval.`);
      setShowForm(false);
      setLinkedAccountId("");
      setCardType("DEBIT");
      setLimitAmount("");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Card application failed.";
      console.error("Card application failed:", errorMessage);
      alert(errorMessage);
    }
  };

  if (isLoading) return <div className="d-flex vh-100 align-items-center justify-content-center">Loading your wallet...</div>;

  return (
    <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh' }}>
      <AppNavbar />
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-5">
          <h1 className="fw-bold" style={{ color: brandColors.navy }}>Card Wallet & Applications</h1>
          {!showForm && <button className="btn btn-danger" onClick={() => setShowForm(true)}><i className="bi bi-plus-circle me-2"></i>Apply for New Card</button>}
        </div>

        {showForm && (
          <div className="card shadow border-0 mb-5">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="card-title fw-bold" style={{color: brandColors.navy}}>New Card Application</h4>
                <button className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6"><label htmlFor="cardType" className="form-label">1. Select Card Type</label><select id="cardType" className="form-select" value={cardType} onChange={e => { setCardType(e.target.value); setLinkedAccountId(""); }}><option value="DEBIT">Debit Card</option><option value="CREDIT">Credit Card</option></select></div>
                <div className="col-md-6"><label htmlFor="linkedAccount" className="form-label">2. Link to Bank Account</label><select id="linkedAccount" className="form-select" value={linkedAccountId} onChange={e => setLinkedAccountId(e.target.value)} required><option value="" disabled>-- Select an account --</option>{eligibleAccounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.accountNo} ({acc.accountType})</option>))}</select>{eligibleAccounts.length === 0 && <small className="text-danger d-block mt-1">No eligible accounts for this card type.</small>}</div>
                {cardType === 'CREDIT' && (<div className="col-md-6"><label htmlFor="limitAmount" className="form-label">3. Requested Credit Limit (₹)</label><input type="number" id="limitAmount" className="form-control" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} placeholder="e.g., 50000" required min="1" /></div>)}
                <div className="col-12 d-flex justify-content-end"><button type="submit" className="btn btn-primary" disabled={eligibleAccounts.length === 0 || !linkedAccountId || hasPendingForSelection}>{hasPendingForSelection ? "Application Pending" : "Submit Application"}</button></div>
              </form>
            </div>
          </div>
        )}

        {accounts.length > 0 ? accounts.map(account => {
          const accountCards = cardsByAccount.get(account.id) || [];
          const bank = bankMap.get(account.bankId);
          return (
            <div className="mb-5" key={account.id}>
              <div className="p-3 rounded mb-3" style={{backgroundColor: '#e9ecef'}}>
                <h5 className="mb-0">Account: {account.accountNo} ({account.accountType}) | Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}</h5>
                <small className="text-muted">{bank ? bank.branchName : "NEO BANK"}</small>
              </div>
              <div className="row g-4">
                {accountCards.length > 0 ? accountCards.map(card => (
                  <div className="col-lg-4 col-md-6" key={card.id}><CardView card={card} user={user} /></div>
                )) : (
                  <div className="col-12"><div className="card card-body text-center bg-light text-muted border-dashed">No cards are associated with this account.</div></div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="card card-body text-center bg-light text-muted border-dashed p-5">You have no bank accounts to link cards to. Please create an account first.</div>
        )}
      </div>
      <Footer />
      <style>{`.border-dashed { border-style: dashed; }`}</style>
    </div>
  );
}

const CardView = ({ card, user }) => {
    const isDebit = card.cardType === 'DEBIT';
    const cardStyle = {
        background: isDebit ? 'linear-gradient(135deg, #0052D4, #4364F7, #6FB1FC)' : 'linear-gradient(135deg, #1D976C, #93F9B9)',
        color: 'white',
        borderRadius: '15px',
        padding: '25px',
        position: 'relative',
        overflow: 'hidden'
    };
    const statusConfig = {
      ACTIVE: { bg: 'success-soft', text: 'success', label: 'Active' },
      PENDING_APPROVAL: { bg: 'warning-soft', text: 'warning', label: 'Pending' },
      BLOCKED: { bg: 'danger-soft', text: 'danger', label: 'Blocked' },
      INACTIVE: { bg: 'secondary-soft', text: 'secondary', label: 'Inactive' },
    };
    const currentStatus = statusConfig[card.status] || statusConfig.INACTIVE;

    return (
        <div className="shadow h-100" style={cardStyle}>
            <div className="d-flex justify-content-between align-items-start">
                <h5 className="fw-bold">NEO BANK</h5>
                <span className={`badge bg-${currentStatus.bg} text-${currentStatus.text}`}>{currentStatus.label}</span>
            </div>
            <div className="my-4">
                <i className="bi bi-cpu" style={{fontSize: '2rem', opacity: 0.8}}></i>
            </div>
            <p className="font-monospace fs-5" style={{ letterSpacing: '3px' }}>{card.cardNo.replace(/(\d{4})/g, '$1 ').trim()}</p>
            <div className="d-flex justify-content-between">
                <div><small className="opacity-75">Card Holder</small><div className="fw-bold text-uppercase">{user?.username || 'N/A'}</div></div>
                <div><small className="opacity-75">Expires</small><div className="fw-bold">{new Date(card.expDate).getMonth() + 1}/{new Date(card.expDate).getFullYear().toString().slice(-2)}</div></div>
            </div>
             <style>{`
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.2); } .text-success { color: #d1e7dd !important; }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.2); } .text-warning { color: #fff3cd !important; }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.2); } .text-danger { color: #f8d7da !important; }
            `}</style>
        </div>
    );
};

export default CardApplication;
