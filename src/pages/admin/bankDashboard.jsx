import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// API Endpoints
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const CARDS_API_URL = 'http://localhost:9004/cards';
const BRANCHES_API_URL = 'http://localhost:9003/api/branches';
const USERS_API_URL = 'http://localhost:9001/api/user'; 
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send';

function BankDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const branchIdFromURL = searchParams.get('branchId');

    const [branch, setBranch] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState(new Map());
    const [cardsMap, setCardsMap] = useState(new Map()); // Maps accountId to its debit card
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!branchIdFromURL) {
            navigate("/admin/branches");
            return;
        }

        const storedData = JSON.parse(localStorage.getItem("user"));
        if (!storedData?.user) {
            navigate("/login");
            return;
        }

        const token = storedData.accessToken;
        const headers = { 'Authorization': `Bearer ${token}` };

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [branchRes, accountsRes] = await Promise.all([
                    axios.get(`${BRANCHES_API_URL}/${branchIdFromURL}`, { headers }),
                    axios.get(`${ACCOUNTS_API_URL}/by-branch/${branchIdFromURL}`, { headers })
                ]);

                const fetchedAccounts = accountsRes.data;
                setBranch(branchRes.data);
                setAccounts(fetchedAccounts);

                if (fetchedAccounts.length > 0) {
                    const userIds = [...new Set(fetchedAccounts.map(acc => acc.userId))];
                    
                    const userPromises = userIds.map(id => 
                        axios.get(`${USERS_API_URL}/${id}`, { headers }).catch(() => null)
                    );
                    const userResults = await Promise.all(userPromises);
                    const userMap = new Map();
                    userResults.filter(res => res).forEach(res => userMap.set(res.data.id, res.data));
                    setUsers(userMap);

                    const cardPromises = fetchedAccounts.map(acc => 
                        axios.get(`${CARDS_API_URL}/account/${acc.id}/debit`, { headers }).catch(() => null)
                    );
                    const cardResults = await Promise.all(cardPromises);
                    const newCardsMap = new Map();
                    cardResults.filter(res => res && res.data).forEach(res => {
                        newCardsMap.set(res.data.accountId, res.data);
                    });
                    setCardsMap(newCardsMap);
                }
            } catch (error) {
                console.error("Failed to fetch initial dashboard data:", error);
                alert("Could not load initial data. Check permissions and service availability.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [branchIdFromURL, navigate]);

    const stats = useMemo(() => ({
        totalBalance: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        totalAccounts: accounts.length,
        totalUsers: users.size,
    }), [accounts, users]);

    const sendTransactionNotification = async (user, account, card, transactionType, amount, token) => {
        if (!user || !user.email) return;

        const emailBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Transaction Notification</h2>
                <p>Dear ${user.username},</p>
                <p>A transaction has occurred on your account ending in <strong>${account.accountNo.slice(-4)}</strong>.</p>
                <ul style="list-style-type: none; padding: 0;">
                    <li style="padding: 5px 0;"><strong>Transaction Type:</strong> ${transactionType}</li>
                    <li style="padding: 5px 0;"><strong>Amount:</strong> ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}</li>
                    <li style="padding: 5px 0;"><strong>New Account Balance:</strong> ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}</li>
                    ${card ? `<li style="padding: 5px 0;"><strong>New Card Available Balance:</strong> ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.availableAmount)}</li>` : ''}
                </ul>
                <p>Thank you for banking with us.</p>
            </div>`;

            console.log(emailBody);
            console.log("Sending notification to:", user.email);

        try {
            await axios.post(NOTIFICATION_API_URL, {
                to: user.email,
                subject: `Your account was ${transactionType === 'Deposit' ? 'credited' : 'debited'} by ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}`,
                body: emailBody,
            }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error("Failed to send transaction notification:", error);
        }
    };
    
    const handleTransaction = async (accountId, amount, type) => {
        if (!amount || amount <= 0) {
            alert("Please enter a valid, positive amount.");
            return;
        }

        const account = accounts.find(acc => acc.id === accountId);
        if (type === 'Withdraw' && amount > account.balance) {
            alert("Insufficient funds for withdrawal.");
            return;
        }
        
        const user = users.get(account.userId);
        const card = cardsMap.get(accountId);
        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;

        const newBalance = type === 'Deposit' ? account.balance + amount : account.balance - amount;
        const newAvailableAmount = card ? (type === 'Deposit' ? card.availableAmount + amount : card.availableAmount - amount) : null;
        
        try {
            const promises = [
                axios.put(`${ACCOUNTS_API_URL}/${accountId}/balance`, { newBalance }, { headers: { 'Authorization': `Bearer ${token}` } })
            ];
            if (card) {
                promises.push(axios.put(`${CARDS_API_URL}/${card.id}/available-amount`, { newAvailableAmount }, { headers: { 'Authorization': `Bearer ${token}` } }));
            }
            await Promise.all(promises);

            setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
            if (card) {
                setCardsMap(prev => new Map(prev).set(accountId, { ...card, availableAmount: newAvailableAmount }));
            }
            
            alert(`${type} successful!`);
            
            await sendTransactionNotification(
                user, 
                { ...account, balance: newBalance }, 
                card ? { ...card, availableAmount: newAvailableAmount } : null, 
                type, 
                amount, 
                token
            );
        } catch (error) {
            console.error(`Failed to process ${type}:`, error);
            alert(`Failed to process ${type}.`);
        }
    };

    const handleFreezeToggle = async (accountId, currentStatus) => {
        const action = currentStatus === 'ACTIVE' ? 'freeze' : 'unfreeze';
        const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;

        try {
            await axios.put(`${ACCOUNTS_API_URL}/${accountId}/${action}`, null, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, status: newStatus } : acc));
            alert(`Account successfully ${action}d!`);
        } catch (error) {
            console.error(`Failed to ${action} account:`, error);
            alert(`Could not ${action} the account.`);
        }
    };

    if (isLoading) {
        return <div className="text-center p-5">Loading Bank Dashboard...</div>;
    }

    return (
        <>
            <AppNavbar />
            <div className="container py-5">
                {branch && (
                    <>
                        <h2 className="mb-1">Dashboard for: <span className="text-primary">{branch.branchName}</span></h2>
                        <p className="text-muted">{`${branch.address.street}, ${branch.address.city}, ${branch.address.state}`}</p>
                    </>
                )}

                <div className="row g-4 my-4">
                    <div className="col-md-4"><div className="card text-center p-3 shadow-sm h-100"><h5>Total Balance</h5><p className="h3">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalBalance)}</p></div></div>
                    <div className="col-md-4"><div className="card text-center p-3 shadow-sm h-100"><h5>Total Users</h5><p className="h3">{stats.totalUsers}</p></div></div>
                    <div className="col-md-4"><div className="card text-center p-3 shadow-sm h-100"><h5>Total Accounts</h5><p className="h3">{stats.totalAccounts}</p></div></div>
                </div>

                <h3 className="mb-3">User Accounts</h3>
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr><th>User</th><th>Account No.</th><th>Type</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {accounts.length > 0 ? accounts.map(acc => (
                                    <tr key={acc.id}>
                                        <td>{users.get(acc.userId)?.username || `User ID: ${acc.userId}`}</td>
                                        <td>{acc.accountNo}</td>
                                        <td>{acc.accountType}</td>
                                        <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(acc.balance)}</td>
                                        <td><span className={`badge ${acc.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>{acc.status}</span></td>
                                        <td style={{ minWidth: '320px' }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <DepositWithdrawButtons 
                                                    onDeposit={(amount) => handleTransaction(acc.id, amount, 'Deposit')}
                                                    onWithdraw={(amount) => handleTransaction(acc.id, amount, 'Withdraw')}
                                                />
                                                <button 
                                                    onClick={() => handleFreezeToggle(acc.id, acc.status)}
                                                    className={`btn btn-sm ${acc.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-info'}`}
                                                >
                                                    {acc.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="text-center p-4">No accounts found for this branch.</td></tr>
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

const DepositWithdrawButtons = ({ onDeposit, onWithdraw }) => {
    const [amount, setAmount] = useState('');

    const handleDeposit = () => {
        onDeposit(Number(amount));
        setAmount('');
    };

    const handleWithdraw = () => {
        onWithdraw(Number(amount));
        setAmount('');
    };

    return (
        <div className="d-flex align-items-center gap-2">
            <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="form-control form-control-sm"
                placeholder="Amount"
                style={{width: '100px'}}
                min="1"
            />
            <button onClick={handleDeposit} className="btn btn-sm btn-success">D</button>
            <button onClick={handleWithdraw} className="btn btn-sm btn-danger">W</button>
        </div>
    );
};

export default BankDashboard;
