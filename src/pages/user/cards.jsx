import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// API Endpoints
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const CARDS_API_URL = 'http://localhost:9004/cards';
const BANKS_API_URL = 'http://localhost:9003/api/branches'; // Added for bank details

function CardApplication() {
    const navigate = useNavigate();

    // State
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [bankMap, setBankMap] = useState(new Map()); // Added state for banks
    const [existingCards, setExistingCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(true);
    const [cardType, setCardType] = useState("DEBIT");
    const [linkedAccountId, setLinkedAccountId] = useState("");
    const [limitAmount, setLimitAmount] = useState("");

    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("user"));
        if (!storedData || !storedData.user) {
            navigate("/login");
            return;
        }
        
        const userDetails = storedData.user;
        setUser(userDetails);

        const token = storedData.accessToken;
        const headers = { 'Authorization': `Bearer ${token}` };

        const fetchInitialData = async () => {
            try {
                // Fetch accounts, cards, and banks all at once
                const [accountsRes, cardsRes, banksRes] = await Promise.all([
                    axios.get(`${ACCOUNTS_API_URL}/user/${userDetails.id}`, { headers }),
                    axios.get(`${CARDS_API_URL}/my-cards`, { headers }),
                    axios.get(BANKS_API_URL, { headers })
                ]);
                
                setAccounts(accountsRes.data);
                setExistingCards(cardsRes.data);

                // Create and set the bank map for easy lookup
                const newBankMap = new Map(banksRes.data.map(bank => [bank.id, bank]));
                setBankMap(newBankMap);

            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                alert("Could not load your data. Please ensure all services are running.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!linkedAccountId) {
            return alert("Please select an account to link the card to.");
        }
        
        const selectedAccount = accounts.find(acc => acc.id === Number(linkedAccountId));
        if (!selectedAccount) {
            return alert("Selected account not found. Please refresh and try again.");
        }

        // For credit cards, a limit is required.
        if (cardType === 'CREDIT' && (!limitAmount || limitAmount <= 0)) {
            return alert("Please enter a valid requested credit limit.");
        }

        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;

        // --- THIS IS THE FIX ---
        // If it's a debit card, use the account's balance as the limit.
        // Otherwise, use the limit from the form state.
        const finalLimitAmount = cardType === 'DEBIT' ? selectedAccount.balance : parseFloat(limitAmount);

        const payload = {
            accountId: linkedAccountId,
            cardType: cardType,
            limitAmount: finalLimitAmount,
        };

        try {
            const response = await axios.post(CARDS_API_URL, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setExistingCards([response.data, ...existingCards]);
            alert(`Card request successful!`);
            
            setShowForm(false);
            setLinkedAccountId("");
            setCardType("DEBIT");
            setLimitAmount("");

        } catch (error) {
            console.error("Card application failed:", error.response?.data || error.message);
            alert("Card application failed. Please check the console for details.");
        }
    };

    if (isLoading) {
        return <div className="text-center p-5">Loading...</div>;
    }

    return (
        <>
            <AppNavbar />
            <div className="container py-5">
                {/* ... Form remains the same ... */}
                 <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="mb-0">Card Application</h2>
                    {!showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)}>New Application</button>}
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
                                    <select id="cardType" className="form-select" value={cardType} onChange={e => setCardType(e.target.value)}>
                                        <option value="DEBIT">Debit Card</option>
                                        <option value="CREDIT">Credit Card</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="linkedAccount" className="form-label">Link to Bank Account</label>
                                    <select id="linkedAccount" className="form-select" value={linkedAccountId} onChange={e => setLinkedAccountId(e.target.value)} required>
                                        <option value="" disabled>-- Select an account --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.accountNo} ({acc.accountType})
                                            </option>
                                        ))}
                                    </select>
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
                                        />
                                    </div>
                                )}
                                <div className="col-12 d-flex justify-content-end">
                                    <button type="submit" className="btn btn-primary">Submit Application</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <h3 className="mb-3">My Cards</h3>
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                {/* --- NEW: Added "Bank" column --- */}
                                <tr><th>Card Number</th><th>Bank</th><th>Type</th><th>Status</th><th>Limit</th><th>Available</th><th>Issued On</th></tr>
                            </thead>
                            <tbody>
                                {existingCards.length > 0 ? existingCards.map(card => {
                                    // --- NEW: Find the linked account and bank for display ---
                                    const linkedAccount = accounts.find(acc => acc.id === card.accountId);
                                    const bank = linkedAccount ? bankMap.get(linkedAccount.bankId) : null;
                                    
                                    return (
                                        <tr key={card.id}>
                                            <td><code>{card.cardNo}</code></td>
                                            {/* --- NEW: Display bank name --- */}
                                            <td>{bank ? bank.branchName : 'N/A'}</td>
                                            <td>{card.cardType}</td>
                                            <td><span className={`badge ${card.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>{card.status}</span></td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.limitAmount)}</td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.availableAmount)}</td>
                                            <td>{new Date(card.dateOfIssue).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="7" className="text-center p-4">You have not applied for any cards yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default CardApplication;
