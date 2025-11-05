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
  lightGray: '#f8f9fa',
  successGreen: '#28a745',
  borderGray: '#dee2e6'
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

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [errorData, setErrorData] = useState(null);

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

  const formatDateTime = () => {
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return now.toLocaleString('en-IN', options);
  };

  const getSourceAccount = () => {
    return accounts.find(acc => acc.id === parseInt(sourceAccountId));
  };

  const getDestAccount = () => {
    if (payFromType === "SELF") {
      return accounts.find(acc => acc.id === parseInt(destAccountId));
    }
    return null;
  };

  const getSelectedCard = () => {
    return cards.find(card => card.id === parseInt(sourceCardId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid, positive amount.");
      return;
    }

    // Validation checks
    if (payFromType === "SELF") {
      if (!sourceAccountId || !destAccountId || sourceAccountId === destAccountId) {
        setError("Please select two different accounts for the transfer.");
        return;
      }
    } else if (payFromType === "TO_ACCOUNT") {
      if (!sourceAccountId || !externalDestAccount) {
        setError("Please select your source account and enter a destination account number.");
        return;
      }
    } else if (payFromType === "CARD") {
      if (!sourceCardId || !merchant) {
        setError("Please select a card and enter a merchant name.");
        return;
      }
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    setShowConfirmModal(false);
    
    const paymentAmount = parseFloat(amount);
    const token = getAuthToken();
    if (!token) {
      setError("Authentication error. Please log in again.");
      return;
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      let payload = {};
      let response;

      if (payFromType === "SELF") {
        const destAccount = accounts.find(acc => acc.id === parseInt(destAccountId));
        payload = { fromAccountId: sourceAccountId, toAccountNumber: destAccount.accountNo, amount: paymentAmount };
        response = await axios.post(`${TRANSACTIONS_API_URL}/transfer`, payload, config);
        
        setTransactionData({
          transactionId: response.data.id || `TXN${Date.now()}`,
          amount: paymentAmount,
          fromAccount: getSourceAccount(),
          toAccount: getDestAccount(),
          toAccountNumber: destAccount.accountNo,
          type: 'Self Transfer',
          dateTime: formatDateTime(),
          status: 'Completed'
        });
        
        setShowSuccessModal(true);

      } else if (payFromType === "TO_ACCOUNT") {
        payload = { fromAccountId: sourceAccountId, toAccountNumber: externalDestAccount, amount: paymentAmount };
        response = await axios.post(`${TRANSACTIONS_API_URL}/transfer`, payload, config);
        
        setTransactionData({
          transactionId: response.data.id || `TXN${Date.now()}`,
          amount: paymentAmount,
          fromAccount: getSourceAccount(),
          toAccountNumber: externalDestAccount,
          type: 'External Transfer',
          dateTime: formatDateTime(),
          status: 'Completed'
        });
        
        setShowSuccessModal(true);

      } else if (payFromType === "CARD") {
        payload = { cardId: sourceCardId, amount: paymentAmount, merchant: merchant };
        response = await axios.post(`${TRANSACTIONS_API_URL}/payment/card`, payload, config);
        
        setTransactionData({
          transactionId: response.data.id || `TXN${Date.now()}`,
          amount: paymentAmount,
          card: getSelectedCard(),
          merchant: merchant,
          type: 'Card Payment',
          dateTime: formatDateTime(),
          status: 'Completed'
        });
        
        setShowSuccessModal(true);
      }
      
      // Reset form
      setAmount("");
      setMerchant("");
      setExternalDestAccount("");
      
    } catch (err) {
      setErrorData({
        errorCode: err.response?.data?.code || 'ERR_PAYMENT_FAILED',
        message: err.response?.data?.message || "Payment failed. Please check your details and try again.",
        dateTime: formatDateTime(),
        status: 'Failed'
      });
      setShowErrorModal(true);
    }
  };

  const closeAllModals = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setShowErrorModal(false);
  };

  const retryPayment = () => {
    setShowErrorModal(false);
  };

  const downloadReceipt = () => {
    alert('Receipt download feature - Integrate with your backend to generate PDF');
    // Implement PDF download from backend
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .modal-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        .modal-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          transform: scale(0.7);
          transition: transform 0.3s ease;
        }
        .modal-overlay.show .modal-container {
          transform: scale(1);
        }
        .modal-header-custom {
          background: linear-gradient(135deg, ${brandColors.successGreen} 0%, #20c997 100%);
          color: white;
          padding: 24px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .modal-header-custom.error {
          background: linear-gradient(135deg, ${brandColors.red} 0%, #dc3545 100%);
        }
        .modal-header-custom.confirm {
          background: linear-gradient(135deg, ${brandColors.navy} 0%, #0056b3 100%);
        }
        .success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-icon svg {
          width: 40px;
          height: 40px;
          stroke: ${brandColors.successGreen};
          stroke-width: 3;
          fill: none;
        }
        .error-icon svg {
          stroke: ${brandColors.red};
        }
        .modal-header-custom h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .modal-header-custom p {
          font-size: 14px;
          opacity: 0.95;
        }
        .modal-body-custom {
          padding: 24px;
        }
        .transaction-detail {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid ${brandColors.borderGray};
        }
        .transaction-detail:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #6c757d;
          font-size: 14px;
          font-weight: 500;
        }
        .detail-value {
          color: #212529;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }
        .amount-highlight {
          font-size: 28px;
          color: ${brandColors.navy};
          font-weight: 700;
          text-align: center;
          padding: 20px 0;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin: 16px 0;
        }
        .modal-footer-custom {
          padding: 20px 24px;
          border-top: 1px solid ${brandColors.borderGray};
          display: flex;
          gap: 12px;
        }
        .btn-modal {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-modal-primary {
          background-color: ${brandColors.navy};
          color: white;
        }
        .btn-modal-primary:hover {
          background-color: ${brandColors.red};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(227, 24, 55, 0.3);
        }
        .btn-modal-secondary {
          background-color: white;
          color: ${brandColors.navy};
          border: 2px solid ${brandColors.navy};
        }
        .btn-modal-secondary:hover {
          background-color: ${brandColors.navy};
          color: white;
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
              
              <div className="row g-3 mt-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" step="0.01" className="form-control form-control-lg" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="col-md-4 text-end">
                  <button type="submit" className="btn btn-primary text-white w-100 btn-pay">Pay Now</button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>

      {/* Confirmation Modal */}
      <div className={`modal-overlay ${showConfirmModal ? 'show' : ''}`} onClick={(e) => e.target.className.includes('modal-overlay') && setShowConfirmModal(false)}>
        <div className="modal-container">
          <div className="modal-header-custom confirm">
            <h2>Confirm Payment Details</h2>
            <p>Please review your transaction before confirming</p>
          </div>
          <div className="modal-body-custom">
            <div className="amount-highlight">₹{parseFloat(amount || 0).toFixed(2)}</div>
            
            {payFromType === "CARD" ? (
              <>
                <div className="transaction-detail">
                  <span className="detail-label">Card</span>
                  <span className="detail-value">{getSelectedCard()?.cardType} - **** {getSelectedCard()?.cardNo.slice(-4)}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Available Amount</span>
                  <span className="detail-value">₹{getSelectedCard()?.availableAmount.toFixed(2)}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Merchant</span>
                  <span className="detail-value">{merchant}</span>
                </div>
              </>
            ) : (
              <>
                <div className="transaction-detail">
                  <span className="detail-label">From Account</span>
                  <span className="detail-value">{getSourceAccount()?.accountType} - {getSourceAccount()?.accountNo}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Available Balance</span>
                  <span className="detail-value">₹{getSourceAccount()?.balance.toFixed(2)}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">To Account</span>
                  <span className="detail-value">{payFromType === "SELF" ? `${getDestAccount()?.accountType} - ${getDestAccount()?.accountNo}` : externalDestAccount}</span>
                </div>
              </>
            )}
            <div className="transaction-detail">
              <span className="detail-label">Transfer Type</span>
              <span className="detail-value">{payFromType === "SELF" ? "Self Transfer" : payFromType === "TO_ACCOUNT" ? "External Transfer" : "Card Payment"}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">{formatDateTime()}</span>
            </div>
          </div>
          <div className="modal-footer-custom">
            <button className="btn-modal btn-modal-secondary" onClick={closeAllModals}>Cancel</button>
            <button className="btn-modal btn-modal-primary" onClick={confirmPayment}>Confirm & Pay</button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <div className={`modal-overlay ${showSuccessModal ? 'show' : ''}`} onClick={(e) => e.target.className.includes('modal-overlay') && closeAllModals()}>
        <div className="modal-container">
          <div className="modal-header-custom">
            <div className="success-icon">
              <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2>Payment Successful!</h2>
            <p>Your transaction has been processed successfully</p>
          </div>
          <div className="modal-body-custom">
            <div className="amount-highlight">₹{transactionData?.amount.toFixed(2)}</div>
            
            <div className="transaction-detail">
              <span className="detail-label">Transaction ID</span>
              <span className="detail-value">{transactionData?.transactionId}</span>
            </div>
            {transactionData?.type === "Card Payment" ? (
              <>
                <div className="transaction-detail">
                  <span className="detail-label">Card</span>
                  <span className="detail-value">{transactionData?.card?.cardType} - **** {transactionData?.card?.cardNo.slice(-4)}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">Merchant</span>
                  <span className="detail-value">{transactionData?.merchant}</span>
                </div>
              </>
            ) : (
              <>
                <div className="transaction-detail">
                  <span className="detail-label">From Account</span>
                  <span className="detail-value">{transactionData?.fromAccount?.accountType} - {transactionData?.fromAccount?.accountNo}</span>
                </div>
                <div className="transaction-detail">
                  <span className="detail-label">To Account</span>
                  <span className="detail-value">{transactionData?.toAccount ? `${transactionData.toAccount.accountType} - ${transactionData.toAccount.accountNo}` : transactionData?.toAccountNumber}</span>
                </div>
              </>
            )}
            <div className="transaction-detail">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">{transactionData?.dateTime}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Status</span>
              <span className="detail-value" style={{ color: brandColors.successGreen }}>{transactionData?.status}</span>
            </div>
          </div>
          <div className="modal-footer-custom">
            <button className="btn-modal btn-modal-secondary" onClick={downloadReceipt}>Download Receipt</button>
            <button className="btn-modal btn-modal-primary" onClick={closeAllModals}>Done</button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <div className={`modal-overlay ${showErrorModal ? 'show' : ''}`} onClick={(e) => e.target.className.includes('modal-overlay') && closeAllModals()}>
        <div className="modal-container">
          <div className="modal-header-custom error">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" className="error-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2>Payment Failed</h2>
            <p>We couldn't process your transaction</p>
          </div>
          <div className="modal-body-custom">
            <div className="transaction-detail">
              <span className="detail-label">Error Code</span>
              <span className="detail-value">{errorData?.errorCode}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Message</span>
              <span className="detail-value">{errorData?.message}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">{errorData?.dateTime}</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Status</span>
              <span className="detail-value" style={{ color: brandColors.red }}>{errorData?.status}</span>
            </div>
          </div>
          <div className="modal-footer-custom">
            <button className="btn-modal btn-modal-secondary" onClick={closeAllModals}>Cancel</button>
            <button className="btn-modal btn-modal-primary" onClick={retryPayment}>Try Again</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
