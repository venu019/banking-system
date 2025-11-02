import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ACCOUNTS_API_URL = "http://localhost:9002/api/accounts";
const CARDS_API_URL = "http://localhost:9004/cards"; // Using consistent /api path
const TRANSACTIONS_API_URL = "http://localhost:9005/transactions"; // Using consistent base path

const getAuthToken = () => {
  const storedData = JSON.parse(localStorage.getItem("user"));
  return storedData?.accessToken;
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

  if (isLoading) return <div className="text-center p-5">Loading Payment Gateway...</div>;

  return (
    <>
      <AppNavbar />
      <div className="container py-5">
        <h2 className="mb-4">Make a Payment</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card shadow-sm p-4">
            <h5 className="mb-4">Payment Details</h5>

            <div className="mb-3">
              <label className="form-label">Pay From</label>
              <select className="form-select" value={payFromType} onChange={(e) => setPayFromType(e.target.value)} required>
                <option value="SELF">My Accounts (Self Transfer)</option>
                <option value="TO_ACCOUNT">My Account (to Other Account)</option>
                <option value="CARD">My Card</option>
              </select>
            </div>

            {(payFromType === "SELF" || payFromType === "TO_ACCOUNT") && (
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">From Account</label>
                  <select className="form-select" value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} required>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountType} - {acc.accountNo} (Balance: ₹{acc.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {payFromType === "SELF" && (
                  <div className="col-md-6">
                    <label className="form-label">To Account</label>
                    <select className="form-select" value={destAccountId} onChange={(e) => setDestAccountId(e.target.value)} required disabled={destinationAccountsForSelf.length === 0}>
                      {destinationAccountsForSelf.length > 0 ? (
                        destinationAccountsForSelf.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.accountType} - {acc.accountNo}</option>
                        ))
                      ) : (
                        <option value="" disabled>No other accounts available</option>
                      )}
                    </select>
                  </div>
                )}

                {payFromType === "TO_ACCOUNT" && (
                  <div className="col-md-6">
                    <label className="form-label">Destination Account Number</label>
                    <input type="text" className="form-control" value={externalDestAccount} onChange={(e) => setExternalDestAccount(e.target.value)} placeholder="Enter account number" required />
                  </div>
                )}
              </div>
            )}

            {payFromType === "CARD" && (
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Select Card</label>
                  <select className="form-select" value={sourceCardId} onChange={(e) => setSourceCardId(e.target.value)} required>
                    {cards.length > 0 ? (
                      cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.cardType} - **** {card.cardNo.slice(-4)} (Avail: ₹{card.availableAmount.toFixed(2)})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No active cards found</option>
                    )}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Merchant Name</label>
                  <input type="text" className="form-control" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g., Amazon, Starbucks" required />
                </div>
              </div>
            )}

            <div className="row align-items-end">
              <div className="col-md-6">
                <label className="form-label">Amount (₹)</label>
                <input type="number" step="0.01" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="col-md-6 text-end mt-3">
                <button type="submit" className="btn btn-primary px-5" disabled={isLoading}>Pay Now</button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Payment;
