import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import 'bootstrap-icons/font/bootstrap-icons.css';

const CARDS_API_URL = 'http://localhost:9004/cards';
const USERS_API_URL = 'http://localhost:9001/api/user';
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
};

function AdminCardManagement() {
    const navigate = useNavigate();
    const [allCards, setAllCards] = useState([]);
    const [userMap, setUserMap] = useState(new Map());
    const [accountMap, setAccountMap] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
            if (!token) {
                navigate("/login");
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            const cardsRes = await axios.get(CARDS_API_URL, { headers });
            const cards = cardsRes.data;
            setAllCards(cards);

            if (cards.length === 0) {
                setIsLoading(false);
                return;
            }

            const userIds = [...new Set(cards.map(card => card.userId).filter(id => id))];
            const accountIds = [...new Set(cards.map(card => card.accountId).filter(id => id))];

            const userPromises = userIds.map(id => axios.get(`${USERS_API_URL}/${id}`, { headers }).catch(() => null));
            const accountPromises = accountIds.map(id => axios.get(`${ACCOUNTS_API_URL}/${id}`, { headers }).catch(() => null));

            const [userResults, accountResults] = await Promise.all([Promise.all(userPromises), Promise.all(accountPromises)]);

            const newUserMap = new Map();
            userResults.filter(Boolean).forEach(res => newUserMap.set(res.data.id, res.data));
            
            const newAccountMap = new Map();
            accountResults.filter(Boolean).forEach(res => newAccountMap.set(res.data.id, res.data));

            setUserMap(newUserMap);
            setAccountMap(newAccountMap);

        } catch (error) {
            console.error("Failed to fetch initial card data:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert("Session expired or unauthorized. Please log in again.");
                navigate("/login");
            } else {
                alert("Could not load data. Ensure all services are running and you are logged in as an admin.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredCards = useMemo(() => {
        if (!searchTerm) return allCards;

        const lowerSearch = searchTerm.toLowerCase();

        return allCards.filter(card => {
            const user = userMap.get(card.userId);
            const account = accountMap.get(card.accountId);

            return (
                (user && user.username.toLowerCase().includes(lowerSearch)) ||
                (account && account.accountNo.includes(lowerSearch)) ||
                card.cardNo.slice(-4).includes(lowerSearch) ||
                card.cardType.toLowerCase().includes(lowerSearch) ||
                card.status.toLowerCase().replace('_', ' ').includes(lowerSearch)
            );
        });
    }, [searchTerm, allCards, userMap, accountMap]);

    const handleCardAction = async (cardId, action) => {
        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
        const headers = { 'Authorization': `Bearer ${token}` };
        const endpoint = `${CARDS_API_URL}/${cardId}/${action}`;

        try {
            const response = await axios.patch(endpoint, null, { headers });
            setAllCards(allCards.map(card => card.id === cardId ? response.data : card));
            alert(`Card successfully ${action}ed!`);
        } catch (error) {
            console.error(`Failed to ${action} card:`, error);
            alert(`Could not ${action} the card.`);
        }
    };
    
    const handleAdjustLimit = async (cardId, currentLimit) => {
        const newLimitString = prompt("Enter the new credit limit:", currentLimit);
        if (newLimitString === null) return;

        const newLimit = parseFloat(newLimitString);
        if (isNaN(newLimit) || newLimit <= 0) {
            alert("Please enter a valid, positive number for the limit.");
            return;
        }

        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
        const headers = { 'Authorization': `Bearer ${token}` };
        const endpoint = `${CARDS_API_URL}/${cardId}/limit`;

        try {
            const response = await axios.put(endpoint, { newLimit }, { headers });
            setAllCards(allCards.map(card => card.id === cardId ? response.data : card));
            alert(`Credit limit successfully updated!`);
        } catch (error) {
            console.error('Failed to adjust credit limit:', error);
            alert('Could not adjust the credit limit.');
        }
    };

    if (isLoading) {
        return (
            <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh' }}>
            <AppNavbar />
            <div className="container py-5">
                <div className="text-center mb-4">
                    <h1 className="display-5 fw-bold" style={{ color: brandColors.navy }}>Card Management</h1>
                    <p className="lead text-muted">Approve, block, and manage all user cards from one place.</p>
                </div>
                
                <div className="row justify-content-center mb-4">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text"><i className="bi bi-search"></i></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by User, Account No, Card No, Type, or Status..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card shadow">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Account No.</th>
                                    <th>Card Type / No.</th>
                                    <th>Status</th>
                                    <th>Limit</th>
                                    <th>Available</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCards.length > 0 ? filteredCards.map(card => {
                                    const user = userMap.get(card.userId);
                                    const account = accountMap.get(card.accountId);
                                    return (
                                        <tr key={card.id}>
                                            <td>{user ? user.username : `User ID: ${card.userId}`}</td>
                                            <td>{account ? account.accountNo : 'N/A'}</td>
                                            <td>{card.cardType} - **** {card.cardNo.slice(-4)}</td>
                                            <td>
                                                <span className={`badge fs-6 ${
                                                    card.status === 'ACTIVE' ? 'bg-success-soft text-success' :
                                                    card.status === 'PENDING_APPROVAL' ? 'bg-warning-soft text-warning' :
                                                    'bg-danger-soft text-danger'
                                                }`}>{card.status.replace('_', ' ')}</span>
                                            </td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.limitAmount)}</td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.availableAmount)}</td>
                                            <td className="text-center">
                                                <div className="btn-group btn-group-sm">
                                                    {card.status === 'PENDING_APPROVAL' && <button className="btn btn-outline-success" onClick={() => handleCardAction(card.id, 'approve')}>Approve</button>}
                                                    {card.status === 'ACTIVE' && (
                                                        <>
                                                            {card.cardType === 'CREDIT' && (
                                                                <button className="btn btn-outline-primary" onClick={() => handleAdjustLimit(card.id, card.limitAmount)}>Limit</button>
                                                            )}
                                                            <button className="btn btn-outline-danger" onClick={() => handleCardAction(card.id, 'block')}>Block</button>
                                                        </>
                                                    )}
                                                    {card.status === 'BLOCKED' && <button className="btn btn-outline-info" onClick={() => handleCardAction(card.id, 'unblock')}>Unblock</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="7" className="text-center p-5 text-muted">{searchTerm ? 'No matching cards found.' : 'No cards found in the system.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
            <style>{`
                thead th { background-color: ${brandColors.navy}; color: white; border-bottom: 2px solid ${brandColors.red}; }
                .table-hover tbody tr:hover { background-color: rgba(1, 33, 105, 0.03); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .text-success { color: #198754 !important; }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .text-warning { color: #ffc107 !important; }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .text-danger { color: #dc3545 !important; }
            `}</style>
        </div>
    );
}

export default AdminCardManagement;
