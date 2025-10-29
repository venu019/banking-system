import React, { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";


const CARDS_API_URL = 'http://localhost:9004/cards';
const USERS_API_URL = 'http://localhost:9001/api/user'; 
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';

function AdminCardManagement() {
    const navigate = useNavigate();
    const [allCards, setAllCards] = useState([]);
    const [userMap, setUserMap] = useState(new Map());
    const [accountMap, setAccountMap] = useState(new Map());
    const [isLoading, setIsLoading] = useState(true);

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

            const newUserMap = new Map();
            for (const id of userIds) {
                try {
                    const userRes = await axios.get(`${USERS_API_URL}/${id}`, { headers });
                    newUserMap.set(id, userRes.data);
                } catch (error) {
                    console.error(`Failed to fetch details for user ID: ${id}`, error);
                }
            }

            const newAccountMap = new Map();
            for (const id of accountIds) {
                try {
                    const accountRes = await axios.get(`${ACCOUNTS_API_URL}/${id}`, { headers });
                    newAccountMap.set(id, accountRes.data);
                } catch (error) {
                    console.error(`Failed to fetch details for account ID: ${id}`, error);
                }
            }
            
            setUserMap(newUserMap);
            console.log(userMap);
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
    
    // --- NEW: Function to handle limit adjustment ---
    const handleAdjustLimit = async (cardId, currentLimit) => {
        const newLimitString = prompt("Enter the new credit limit:", currentLimit);
        if (newLimitString === null) { // User cancelled the prompt
            return;
        }

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
            alert(`Credit limit successfully updated to ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(newLimit)}!`);
        } catch (error) {
            console.error('Failed to adjust credit limit:', error);
            alert('Could not adjust the credit limit.');
        }
    };

    if (isLoading) {
        return <div className="text-center p-5">Loading Card Management Dashboard...</div>;
    }

    return (
        <>
            <AppNavbar />
            <div className="container py-5">
                <h2 className="mb-4">Card Management Dashboard</h2>
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>User</th>
                                    <th>Account No.</th>
                                    <th>Card Type</th>
                                    <th>Status</th>
                                    <th>Limit</th>
                                    <th>Available</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCards.length > 0 ? allCards.map(card => {
                                    const user = userMap.get(card.userId);
                                    const account = accountMap.get(card.accountId);
                                    return (
                                        <tr key={card.id}>
                                            <td>{user ? user.username : `ID: ${card.userId}`}</td>
                                            <td>{account ? account.accountNo : `ID: ${card.accountId}`}</td>
                                            <td>{card.cardType}</td>
                                            <td>
                                                <span className={`badge ${
                                                    card.status === 'ACTIVE' ? 'bg-success' :
                                                    card.status === 'PENDING_APPROVAL' ? 'bg-warning text-dark' :
                                                    'bg-danger'
                                                }`}>{card.status}</span>
                                            </td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.limitAmount)}</td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.availableAmount)}</td>
                                            <td className="d-flex gap-2"> {/* Use flexbox for button alignment */}
                                                {card.status === 'PENDING_APPROVAL' && <button className="btn btn-sm btn-success" onClick={() => handleCardAction(card.id, 'approve')}>Approve</button>}
                                                
                                                {/* --- UPDATED: Actions for ACTIVE cards --- */}
                                                {card.status === 'ACTIVE' && (
                                                    <>
                                                        {card.cardType === 'CREDIT' && (
                                                            <button className="btn btn-sm btn-primary" onClick={() => handleAdjustLimit(card.id, card.limitAmount)}>Edit Limit</button>
                                                        )}
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleCardAction(card.id, 'block')}>Block</button>
                                                    </>
                                                )}

                                                {card.status === 'BLOCKED' && <button className="btn btn-sm btn-info" onClick={() => handleCardAction(card.id, 'unblock')}>Unblock</button>}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="7" className="text-center p-4">No cards found in the system.</td></tr>
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

export default AdminCardManagement;
