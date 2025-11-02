import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// API Endpoints
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const CARDS_API_URL = 'http://localhost:9004/cards';
const BRANCHES_API_URL = 'http://localhost:9003/api/branches';
const USERS_API_URL = 'http://localhost:9001/api/user';
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send';
const TRANSACTIONS_API_URL = 'http://localhost:9005/transactions'; // Transaction service endpoint

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
};

function BankDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const branchIdFromURL = searchParams.get('branchId');

    const [branch, setBranch] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState(new Map());
    const [cardsMap, setCardsMap] = useState(new Map());
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
                    const userPromises = userIds.map(id => axios.get(`${USERS_API_URL}/${id}`, { headers }).catch(() => null));
                    const userResults = await Promise.all(userPromises);
                    const userMap = new Map();
                    userResults.filter(res => res).forEach(res => userMap.set(res.data.id, res.data));
                    setUsers(userMap);

                    const cardPromises = fetchedAccounts.map(acc => axios.get(`${CARDS_API_URL}/account/${acc.id}/debit`, { headers }).catch(() => null));
                    const cardResults = await Promise.all(cardPromises);
                    const newCardsMap = new Map();
                    cardResults.filter(res => res && res.data).forEach(res => {
                        newCardsMap.set(res.data.accountId, res.data);
                    });
                    setCardsMap(newCardsMap);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                alert("Could not load dashboard data. Please check permissions and service availability.");
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
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; padding: 40px; text-align: center;">
                <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <div style="background-color: #012169; color: white; padding: 20px;">
                        <h1 style="margin: 0; font-size: 24px;">Transaction Alert</h1>
                    </div>
                    <div style="padding: 30px; text-align: left; color: #333;">
                        <h2 style="color: #E31837; margin-top: 0;">Hi ${user.username},</h2>
                        <p>This is a notification that a transaction has just occurred on your account. Here are the details:</p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Account Number:</td><td style="padding: 10px;">**** **** **** ${account.accountNo.slice(-4)}</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Transaction Type:</td><td style="padding: 10px;">${transactionType}</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Amount:</td><td style="padding: 10px; color: ${transactionType === 'Deposit' ? '#198754' : '#dc3545'}; font-weight: bold;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}</td></tr>
                                ${card ? `<tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Card Available Balance:</td><td style="padding: 10px;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.availableAmount)}</td></tr>` : ''}
                                <tr><td style="padding: 10px; font-weight: bold;">New Account Balance:</td><td style="padding: 10px;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}</td></tr>
                            </table>
                        </div>
                        <p>If you did not authorize this transaction, please contact our support team immediately.</p>
                    </div>
                    <div style="background-color: #f1f1f1; padding: 15px; font-size: 12px; color: #666;">
                        This is an automated email. Please do not reply.
                    </div>
                </div>
            </div>
        `;

        try {
            await axios.post(NOTIFICATION_API_URL, {
                to: user.email,
                subject: `Your account was ${transactionType === 'Deposit' ? 'credited' : 'debited'} by ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}`,
                body: emailBody
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

        try {
            // Use the correct transaction service endpoints with request body
            if (type === 'Deposit') {
                await axios.post(`${TRANSACTIONS_API_URL}/deposit`, { accountId, amount }, { headers: { 'Authorization': `Bearer ${token}` } });
            } else {
                await axios.post(`${TRANSACTIONS_API_URL}/withdrawal`, { accountId, amount }, { headers: { 'Authorization': `Bearer ${token}` } });
            }

            // Manually update the local state to reflect the change immediately
            const newBalance = type === 'Deposit' ? account.balance + amount : account.balance - amount;
            const newAvailableAmount = card ? (type === 'Deposit' ? card.availableAmount + amount : card.availableAmount - amount) : null;

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
            console.error(`Failed to process ${type}:`, error.response?.data || error.message);
            alert(`Failed to process ${type}. Please check the console.`);
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
                {branch && (
                    <div className="text-center mb-5">
                        <h1 className="display-5 fw-bold" style={{ color: brandColors.navy }}>{branch.branchName} Dashboard</h1>
                        <p className="lead text-muted">{`${branch.address.street}, ${branch.address.city}, ${branch.address.state}`}</p>
                    </div>
                )}

                <div className="row g-4 mb-5">
                    <StatCard icon="bi-cash-stack" title="Total Branch Balance" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalBalance)} />
                    <StatCard icon="bi-people-fill" title="Total Unique Users" value={stats.totalUsers} />
                    <StatCard icon="bi-journal-text" title="Total Accounts" value={stats.totalAccounts} />
                </div>

                <div className="card shadow-sm">
                    <div className="card-header bg-white py-3">
                        <h4 className="mb-0 fw-bold" style={{color: brandColors.navy}}>User Accounts</h4>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead>
                                <tr>
                                    <th>User</th><th>Account No.</th><th>Type</th><th>Balance</th><th>Status</th><th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.length > 0 ? accounts.map(acc => (
                                    <tr key={acc.id}>
                                        <td>{users.get(acc.userId)?.username || `User ID: ${acc.userId}`}</td>
                                        <td>{acc.accountNo}</td>
                                        <td>{acc.accountType.replace('_', ' ')}</td>
                                        <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(acc.balance)}</td>
                                        <td><span className={`badge fs-6 ${acc.status === "ACTIVE" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{acc.status}</span></td>
                                        <td style={{ minWidth: '350px' }}>
                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                <DepositWithdrawButtons 
                                                    onDeposit={(amount) => handleTransaction(acc.id, amount, 'Deposit')}
                                                    onWithdraw={(amount) => handleTransaction(acc.id, amount, 'Withdraw')}
                                                />
                                                <button 
                                                    onClick={() => handleFreezeToggle(acc.id, acc.status)}
                                                    className={`btn btn-sm ${acc.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-info'}`}
                                                >
                                                    <i className={`bi ${acc.status === 'ACTIVE' ? 'bi-lock' : 'bi-unlock'} me-1`}></i>
                                                    {acc.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="text-center p-4 text-muted">No accounts have been created for this branch yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
            <style>{`
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .text-success { color: #198754 !important; }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .text-danger { color: #dc3545 !important; }
                .stat-card { background: linear-gradient(135deg, ${brandColors.navy}, ${brandColors.red}); color: white; border: none; }
            `}</style>
        </div>
    );
}

const StatCard = ({ icon, title, value }) => (
    <div className="col-md-4">
        <div className="card stat-card p-4 h-100 shadow">
            <div className="d-flex align-items-center">
                <i className={`${icon} fs-1 me-4`}></i>
                <div>
                    <h5 className="mb-0 opacity-75">{title}</h5>
                    <p className="display-6 fw-bold mb-0">{value}</p>
                </div>
            </div>
        </div>
    </div>
);

const DepositWithdrawButtons = ({ onDeposit, onWithdraw }) => {
    const [amount, setAmount] = useState('');
    return (
        <div className="input-group input-group-sm" style={{width: '180px'}}>
            <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="form-control"
                placeholder="Amount"
                min="1"
            />
            <button onClick={() => {onDeposit(Number(amount)); setAmount('');}} className="btn btn-outline-success" title="Deposit">D</button>
            <button onClick={() => {onWithdraw(Number(amount)); setAmount('');}} className="btn btn-outline-danger" title="Withdraw">W</button>
        </div>
    );
};

export default BankDashboard;
