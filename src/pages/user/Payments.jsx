import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// API endpoints
const ACCOUNTS_API_URL = "http://localhost:9002/api/accounts";
const CARDS_API_URL = "http://localhost:9003/cards";
const TRANSACTIONS_API_URL = "http://localhost:9004/api/transactions";

// Helper to get auth token
const getAuthToken = () => {
    const storedData = JSON.parse(localStorage.getItem("user"));
    return storedData?.accessToken;
};

const Payment = () => {
    const navigate = useNavigate();

    // Data states
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [cards, setCards] = useState([]);
    
    // UI/Form states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const [sourceType, setSourceType] = useState("ACCOUNT"); // ACCOUNT or CARD
    const [sourceAccountId, setSourceAccountId] = useState("");
    const [sourceCardId, setSourceCardId] = useState("");
    const [destAccountId, setDestAccountId] = useState("");
    const [merchant, setMerchant] = useState("");
    const [amount, setAmount] = useState("");

    // Initial data fetch
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
                    axios.get(`${CARDS_API_URL}/my-cards`, { headers })
                ]);

                const activeCards = cardsRes.data.filter(c => c.status === 'ACTIVE');
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
            if (sourceType === "ACCOUNT") {
                if (!sourceAccountId || !destAccountId) {
                    setError("Please select both a source and destination account.");
                    return;
                }
                const payload = { fromAccountId: sourceAccountId, toAccountId: destAccountId, amount: paymentAmount };
                await axios.post(`${TRANSACTIONS_API_URL}/transfer`, payload, config);
                setSuccess("Account transfer completed successfully!");
            } else if (sourceType === "CARD") {
                if (!sourceCardId || !merchant) {
                    setError("Please select a card and enter a merchant name.");
                    return;
                }
                const payload = { cardId: sourceCardId, amount: paymentAmount, merchant: merchant };
                await axios.post(`${TRANSACTIONS_API_URL}/payment/card`, payload, config);
                setSuccess("Card payment processed successfully!");
            }
            // Reset form
            setAmount("");
            setMerchant("");
        } catch (err) {
            setError(err.response?.data?.message || "Payment failed. Please check your balance and try again.");
        }
    };
    
    const destinationAccounts = useMemo(() => {
        return accounts.filter(acc => acc.id !== parseInt(sourceAccountId));
    }, [accounts, sourceAccountId]);

    if (isLoading) return <div className="text-center p-5">Loading Payment Gateway...</div>;

    return (
        <>
            <AppNavbar />
            <div className="container py-5">
                <h2 className="mb-4">Make a Payment</h2>
                
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title">1. Payment Source</h5>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Pay From</label>
                                    <select className="form-select" value={sourceType} onChange={e => setSourceType(e.target.value)}>
                                        <option value="ACCOUNT">My Bank Account</option>
                                        <option value="CARD">My Card</option>
                                    </select>
                                </div>
                                {sourceType === 'ACCOUNT' && (
                                    <div className="col-md-6">
                                        <label className="form-label">Select Source Account</label>
                                        <select className="form-select" value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} required>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.accountType} - {acc.accountNumber} (Balance: &#8377;{acc.balance.toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {sourceType === 'CARD' && (
                                    <div className="col-md-6">
                                        <label className="form-label">Select Card</label>
                                        <select className="form-select" value={sourceCardId} onChange={e => setSourceCardId(e.target.value)} required>
                                            {cards.map(card => (
                                                <option key={card.id} value={card.id}>
                                                    {card.cardType} - **** {card.cardNumber.slice(-4)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title">2. Payment Destination</h5>
                            <div className="row g-3">
                                {sourceType === 'ACCOUNT' && (
                                    <div className="col-md-6">
                                        <label className="form-label">Pay To Account</label>
                                        <select className="form-select" value={destAccountId} onChange={e => setDestAccountId(e.target.value)} required>
                                            <option value="" disabled>Select destination...</option>
                                            {destinationAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.accountType} - {acc.accountNumber}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {sourceType === 'CARD' && (
                                    <div className="col-md-6">
                                        <label className="form-label">Merchant Name</label>
                                        <input type="text" className="form-control" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g., Amazon, Starbucks" required />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">3. Amount</h5>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-6">
                                    <label className="form-label">Amount (&#8377;)</label>
                                    <input type="number" step="0.01" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
                                </div>
                                <div className="col-md-6 text-end">
                                    <button type="submit" className="btn btn-primary px-5">Pay Now</button>
                                </div>
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
