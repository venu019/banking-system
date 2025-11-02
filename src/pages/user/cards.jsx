import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const CARDS_API_URL = 'http://localhost:9004/cards';
const BANKS_API_URL = 'http://localhost:9003/api/branches';
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send'; // Notification service endpoint

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
        console.log(cardsRes.data);
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
    for (const card of existingCards) {
      if (!map.has(card.accountId)) map.set(card.accountId, []);
      map.get(card.accountId).push(card);
    }
    return map;
  }, [existingCards]);

  const hasPendingForSelection = useMemo(() => {
    if (!linkedAccountId) return false;
    return existingCards.some(c =>
      c.accountId === Number(linkedAccountId) &&
      c.cardType === cardType &&
      c.status === 'PENDING_APPROVAL'
    );
  }, [existingCards, linkedAccountId, cardType]);

  const isEligibleForSelection = useMemo(() => {
    if (!linkedAccountId) return false;
    const accId = Number(linkedAccountId);
    return !existingCards.some(c =>
      c.accountId === accId &&
      c.cardType === cardType &&
      (c.status === 'ACTIVE' || c.status === 'PENDING_APPROVAL')
    );
  }, [existingCards, linkedAccountId, cardType]);

  const eligibleAccounts = useMemo(() => {
    return accounts.filter(account => {
      const hasActiveOrPending = existingCards.some(card =>
        card.accountId === account.id &&
        card.cardType === cardType &&
        (card.status === 'ACTIVE' || card.status === 'PENDING_APPROVAL')
      );
      return !hasActiveOrPending;
    });
  }, [accounts, existingCards, cardType]);

  // --- NEW: Function to send card application notification ---
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
    if (!isEligibleForSelection) {
      return alert("An active or pending card of this type already exists for the selected account.");
    }

    const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
    const payload = {
      accountId: linkedAccountId,
      cardType: cardType,
      limitAmount: cardType === 'CREDIT' ? parseFloat(limitAmount) : 0,
    };

    try {
      const response = await axios.post(`${CARDS_API_URL}/apply`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const newCardApplication = response.data;
      setExistingCards([newCardApplication, ...existingCards]);
      
      // --- SEND NOTIFICATION ---
      await sendCardApplicationNotification(newCardApplication, user, token);

      alert(`Card application submitted successfully! Your request is pending admin approval.`);

      setShowForm(false);
      setLinkedAccountId("");
      setCardType("DEBIT");
      setLimitAmount("");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Card application failed. You may already have an active or pending card of this type.";
      console.error("Card application failed:", errorMessage);
      alert(errorMessage);
    }
  };

  if (isLoading) return <div className="text-center p-5">Loading Card Wallet...</div>;

  return (
    <>
      <AppNavbar />
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 className="mb-0">Card Application & Wallet</h2>
          {!showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)}>Apply for New Card</button>}
        </div>

        {showForm && (
          <div className="card shadow-sm border-0 mb-5">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <h5 className="card-title">New Card Application</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
              <hr/>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="cardType" className="form-label">Card Type</label>
                  <select id="cardType" className="form-select" value={cardType} onChange={e => { setCardType(e.target.value); setLinkedAccountId(""); }}>
                    <option value="DEBIT">Debit Card</option>
                    <option value="CREDIT">Credit Card</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="linkedAccount" className="form-label">Link to Bank Account</label>
                  <select
                    id="linkedAccount"
                    className="form-select"
                    value={linkedAccountId}
                    onChange={e => setLinkedAccountId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select an account --</option>
                    {eligibleAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNo} ({acc.accountType})
                      </option>
                    ))}
                  </select>
                  {eligibleAccounts.length === 0 && (
                    <small className="text-danger d-block mt-1">
                      No eligible accounts. You may already have a card for the selected type on all accounts.
                    </small>
                  )}
                </div>
                {cardType === 'CREDIT' && (
                  <div className="col-md-6">
                    <label htmlFor="limitAmount" className="form-label">Requested Credit Limit (₹)</label>
                    <input
                      type="number"
                      id="limitAmount"
                      className="form-control"
                      value={limitAmount}
                      onChange={e => setLimitAmount(e.target.value)}
                      placeholder="e.g., 50000"
                      required
                      min="1"
                    />
                  </div>
                )}
                <div className="col-12 d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary" disabled={eligibleAccounts.length === 0 || !linkedAccountId || hasPendingForSelection}>
                    {hasPendingForSelection ? "Pending Exists" : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h3 className="mb-3">My Card Wallet</h3>

        {accounts.length > 0 ? accounts.map(account => {
          const accountCards = cardsByAccount.get(account.id) || [];
          const bank = bankMap.get(account.bankId);
          return (
            <div className="mb-4" key={account.id}>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-3">
                  Account: {account.accountNo} ({account.accountType}) • Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}
                </h5>
                <span className="text-muted">{bank ? bank.branchName : "NEO BANK"}</span>
              </div>
              <div className="row g-4">
                {accountCards.length > 0 ? accountCards.map(card => (
                  <div className="col-lg-4 col-md-6" key={card.id}>
                    <CardView card={card} user={user} bank={bank} />
                  </div>
                )) : (
                  <div className="col-12">
                    <div className="card card-body text-center text-muted">No cards associated with this account.</div>
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="card card-body text-center text-muted">You have no bank accounts to link cards to.</div>
        )}
      </div>
      <Footer />
    </>
  );
}

const CardView = ({ card, user, bank }) => {
  const isDebit = card.cardType === 'DEBIT';
  const borderClass = isDebit ? 'border-primary' : 'border-success';
  const statusConfig = {
    ACTIVE: { class: 'bg-success', text: 'Active' },
    PENDING_APPROVAL: { class: 'bg-warning text-dark', text: 'Pending' },
    BLOCKED: { class: 'bg-danger', text: 'Blocked' },
    INACTIVE: { class: 'bg-secondary', text: 'Inactive' },
  };
  const currentStatus = statusConfig[card.status] || statusConfig.INACTIVE;

  return (
    <div className={`card shadow-sm h-100`} style={{ borderWidth: '2px' }}>
      <div className="card-body d-flex flex-column p-4 bg-white text-dark">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">NEO BANK</h6>
          <span className={`fw-bold`}>{card.cardType} CARD</span>
        </div>
        <div className="mt-2">
          <p className="font-monospace fs-5 mb-2" style={{ letterSpacing: '2px' }}>
            {card.cardNo.replace(/(\d{4})/g, '$1 ').trim()}
          </p>
          <div className="d-flex justify-content-between mb-2">
            <div>
              <small className="text-muted d-block">Card Holder</small>
              <span className="text-uppercase">{user?.username || 'N/A'}</span>
            </div>
            <div>
              <small className="text-muted d-block">Expires</small>
              <span className="font-monospace">
                {new Date(card.expDate).getMonth() + 1}/{new Date(card.expDate).getFullYear().toString().slice(-2)}
              </span>
            </div>
            <div>
              <small className="text-muted d-block">CVV</small>
              <span className="font-monospace fw-bold">{card.cvv}</span>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <div className="small text-muted">Limit</div>
            <div className="fw-semibold">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.limitAmount)}
            </div>
            <div className="small text-muted">Available</div>
              <div className="fw-semibold">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.availableAmount)}
              </div>
            <div className="text-end">
            </div>
          </div>
          <div className="mt-2 small text-muted">
            Issued on: {new Date(card.dateOfIssue).toLocaleDateString()} <span className={`badge ${currentStatus.class}`}>{currentStatus.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardApplication;
