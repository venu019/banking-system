import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import AppNavbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ACCOUNTS_API_URL = "http://localhost:9002/api/accounts";
const CARDS_API_URL = "http://localhost:9004/cards";
const TRANSACTIONS_API_URL = "http://localhost:9005/transactions";

const getAuthToken = () => {
  const storedData = JSON.parse(localStorage.getItem("user"));
  return storedData?.accessToken;
};

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
};

const Payment = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [payFromType, setPayFromType] = useState("SELF");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destAccountId, setDestAccountId] = useState("");
  const [externalDestAccount, setExternalDestAccount] = useState("");
  const [sourceCardId, setSourceCardId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("user"));
    if (!storedData?.user) {
      navigate("/login");
      return;
    }
    setUser(storedData.user);
    const token = storedData.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      try {
        const [accountsRes, cardsRes] = await Promise.all([
          axios.get(`${ACCOUNTS_API_URL}/user/${storedData.user.id}`, { headers }),
          axios.get(`${CARDS_API_URL}/my-cards`, { headers }),
        ]);

        const activeCards = cardsRes.data.filter((c) => c.status === "ACTIVE");
        setAccounts(accountsRes.data);
        setCards(activeCards);

        if (accountsRes.data.length > 0) {
          setSourceAccountId(accountsRes.data[0].id);
          if (accountsRes.data.length > 1) {
            setDestAccountId(accountsRes.data[1].id);
          }
        }
        if (activeCards.length > 0) {
          setSourceCardId(activeCards[0].id);
        }
      } catch (err) {
        setError("Failed to load your accounts or cards. Please ensure all services are running.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid, positive amount.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Authentication error. Please log in again.");
      return;
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      let payload = {};
      if (payFromType === "SELF") {
        const destAccount = accounts.find(acc => acc.id === parseInt(destAccountId));
        if (!sourceAccountId || !destAccountId || sourceAccountId === destAccountId) {
          setError("Please select two different accounts for the transfer.");
          return;
        }
        payload = { fromAccountId: sourceAccountId, toAccountNumber: destAccount.accountNo, amount: paymentAmount };
        await axios.post(`${TRANSACTIONS_API_URL}/transfer`, payload, config);
        setSuccess("Account transfer completed successfully!");

      } else if (payFromType === "TO_ACCOUNT") {
        if (!sourceAccountId || !externalDestAccount) {
          setError("Please select your source account and enter a destination account number.");
          return;
        }
        payload = { fromAccountId: sourceAccountId, toAccountNumber: externalDestAccount, amount: paymentAmount };
        await axios.post(`${TRANSACTIONS_API_URL}/transfer`, payload, config);
        setSuccess("External account transfer completed successfully!");

      } else if (payFromType === "CARD") {
        if (!sourceCardId || !merchant) {
          setError("Please select a card and enter a merchant name.");
          return;
        }
        payload = { cardId: sourceCardId, amount: paymentAmount, merchant: merchant };
        await axios.post(`${TRANSACTIONS_API_URL}/payment/card`, payload, config);
        setSuccess("Card payment processed successfully!");
      }
      
      setAmount("");
      setMerchant("");
      setExternalDestAccount("");
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please check your details and try again.");
    }
  };

  const destinationAccountsForSelf = useMemo(() => {
    if (!sourceAccountId) return accounts;
    return accounts.filter((acc) => acc.id !== parseInt(sourceAccountId));
  }, [accounts, sourceAccountId]);

  useEffect(() => {
    if (payFromType === "SELF") {
      const isDestinationValid = destinationAccountsForSelf.some(acc => acc.id === parseInt(destAccountId));
      if (!isDestinationValid && destinationAccountsForSelf.length > 0) {
        setDestAccountId(destinationAccountsForSelf[0].id);
      } else if (destinationAccountsForSelf.length === 0) {
        setDestAccountId("");
      }
    }
  }, [sourceAccountId, destAccountId, destinationAccountsForSelf, payFromType]);

  if (isLoading) {
    return (
        <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
  }

  return (
    <>
      <style>{`
        .nav-tabs .nav-link {
          color: ${brandColors.navy};
          border: none;
          border-bottom: 2px solid transparent;
          font-weight: 600;
        }
        .nav-tabs .nav-link.active {
          color: ${brandColors.red};
          border-bottom-color: ${brandColors.red};
          background-color: transparent;
        }
        .btn-pay {
            background-color: ${brandColors.navy};
            border-color: ${brandColors.navy};
            transition: all 0.3s ease;
        }
        .btn-pay:hover {
            background-color: ${brandColors.red};
            border-color: ${brandColors.red};
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
      `}</style>
      <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh' }}>
        <AppNavbar />
        <div className="container py-5" style={{ maxWidth: '720px' }}>
          <div className="text-center mb-4">
            <h1 className="fw-bold" style={{ color: brandColors.navy }}>Make a Payment</h1>
            <p className="text-muted">Securely transfer funds between accounts or pay with your card.</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="card shadow-sm p-4">
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button className={`nav-link ${payFromType === 'SELF' ? 'active' : ''}`} onClick={() => setPayFromType('SELF')}>Self Transfer</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${payFromType === 'TO_ACCOUNT' ? 'active' : ''}`} onClick={() => setPayFromType('TO_ACCOUNT')}>To Another Account</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${payFromType === 'CARD' ? 'active' : ''}`} onClick={() => setPayFromType('CARD')}>Card Payment</button>
              </li>
            </ul>

            <form onSubmit={handleSubmit}>
              {/* --- Account Transfer Fields --- */}
              {(payFromType === "SELF" || payFromType === "TO_ACCOUNT") && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">From Account</label>
                    <select className="form-select" value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} required>
                      {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.accountType} - {acc.accountNo} (Balance: ₹{acc.balance.toFixed(2)})</option>))}
                    </select>
                  </div>
                  {payFromType === "SELF" && (
                    <div className="col-12">
                      <label className="form-label">To Account</label>
                      <select className="form-select" value={destAccountId} onChange={(e) => setDestAccountId(e.target.value)} required disabled={destinationAccountsForSelf.length === 0}>
                        {destinationAccountsForSelf.length > 0 ? (destinationAccountsForSelf.map((acc) => (<option key={acc.id} value={acc.id}>{acc.accountType} - {acc.accountNo}</option>))) : (<option value="" disabled>No other accounts available</option>)}
                      </select>
                    </div>
                  )}
                  {payFromType === "TO_ACCOUNT" && (
                    <div className="col-12">
                      <label className="form-label">Destination Account Number</label>
                      <input type="text" className="form-control" value={externalDestAccount} onChange={(e) => setExternalDestAccount(e.target.value)} placeholder="Enter a valid account number" required />
                    </div>
                  )}
                </div>
              )}

              {/* --- Card Payment Fields --- */}
              {payFromType === "CARD" && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Select Card</label>
                    <select className="form-select" value={sourceCardId} onChange={(e) => setSourceCardId(e.target.value)} required>
                      {cards.length > 0 ? (cards.map((card) => (<option key={card.id} value={card.id}>{card.cardType} - **** {card.cardNo.slice(-4)} (Avail: ₹{card.availableAmount.toFixed(2)})</option>))) : (<option value="" disabled>No active cards found</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Merchant Name</label>
                    <input type="text" className="form-control" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g., Amazon, Starbucks" required />
                  </div>
                </div>
              )}
              
              {/* --- Amount and Submit --- */}
              <div className="row g-3 mt-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" step="0.01" className="form-control form-control-lg" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="col-md-4 text-end">
                  <button type="submit" className="btn btn-primary text-white w-100 btn-pay" disabled={isLoading}>Pay Now</button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Payment;
