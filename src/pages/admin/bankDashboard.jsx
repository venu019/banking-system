import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const BRANCHES_API_URL = 'http://localhost:9003/api/branches';
const USERS_API_URL = 'http://localhost:9001/api/user'; 

function BankDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const branchIdFromURL = searchParams.get('branchId');

    const [branch, setBranch] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState(new Map());
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
            try {
                // Fetch branch and account data
                const branchRes = await axios.get(`${BRANCHES_API_URL}/${branchIdFromURL}`, { headers });
                setBranch(branchRes.data);

                const accountsRes = await axios.get(`${ACCOUNTS_API_URL}/by-branch/${branchIdFromURL}`, { headers });
                setAccounts(accountsRes.data);
                
                // Get unique user IDs from the accounts
                const userIds = [...new Set(accountsRes.data.map(acc => acc.userId))];

                // --- THE FIX: Use a for loop to fetch each user one by one ---
                if (userIds.length > 0) {
                    const userMap = new Map();
                    for (const id of userIds) {
                        try {
                            const userRes = await axios.get(`${USERS_API_URL}/${id}`, { headers });
                            userMap.set(id, userRes.data);
                        } catch (error) {
                            console.error(`Failed to fetch details for user ID: ${id}`, error);
                            // We continue even if one user fails, so the app doesn't crash
                        }
                    }
                    setUsers(userMap);
                }
            } catch (error) {
                console.error("Failed to fetch initial dashboard data:", error);
                alert("Could not load initial data. Please check permissions and ensure all services are running.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [branchIdFromURL, navigate]);

    // --- All other functions (stats, handleBalanceUpdate, handleFreezeToggle) remain the same ---
    const stats = useMemo(() => {
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const totalAccounts = accounts.length;
        const totalUsers = users.size;
        return { totalBalance, totalAccounts, totalUsers };
    }, [accounts, users]);

    const handleBalanceUpdate = async (accountId, newBalance) => {
        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
        try {
            await axios.put(`${ACCOUNTS_API_URL}/${accountId}/balance`, { newBalance }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAccounts(accounts.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
            alert("Balance updated successfully!");
        } catch (error) {
            alert("Failed to update balance.");
        }
    };
    
    const handleFreezeToggle = async (accountId, currentStatus) => {
        const isFreezing = currentStatus === 'ACTIVE';
        const action = isFreezing ? 'freeze' : 'unfreeze';
        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;

        try {
            await axios.put(`${ACCOUNTS_API_URL}/${accountId}/${action}`, null, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAccounts(accounts.map(acc => 
                acc.id === accountId 
                ? { ...acc, status: isFreezing ? 'FROZEN' : 'ACTIVE' } 
                : acc
            ));
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
                    {/* Stats Cards */}
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
                                {accounts.length > 0 ? accounts.map(acc => {
                                    const user = users.get(acc.userId);
                                    return (
                                    <tr key={acc.id}>
                                        <td>{user ? `${user.username} (ID: ${user.id})` : `User ID: ${acc.userId}`}</td>
                                        <td>{acc.accountNo}</td>
                                        <td>{acc.accountType}</td>
                                        <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(acc.balance)}</td>
                                        <td><span className={`badge ${acc.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>{acc.status}</span></td>
                                        <td className="d-flex flex-wrap gap-1">
                                            <UpdateBalanceButton accountId={acc.id} currentBalance={acc.balance} onUpdate={handleBalanceUpdate} />
                                            <button 
                                                onClick={() => handleFreezeToggle(acc.id, acc.status)}
                                                className={`btn btn-sm ${acc.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                            >
                                                {acc.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                                            </button>
                                        </td>
                                    </tr>
                                )}) : (
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

// UpdateBalanceButton component remains the same
const UpdateBalanceButton = ({ accountId, currentBalance, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [balance, setBalance] = useState(currentBalance);

    if (!isEditing) {
        return <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-outline-primary">Update Balance</button>;
    }

    return (
        <div className="d-flex gap-1">
            <input type="number" value={balance} onChange={e => setBalance(parseFloat(e.target.value) || 0)} className="form-control form-control-sm" style={{width: '120px'}}/>
            <button onClick={() => onUpdate(accountId, balance)} className="btn btn-sm btn-success">Save</button>
            <button onClick={() => setIsEditing(false)} className="btn btn-sm btn-secondary">Cancel</button>
        </div>
    );
};

export default BankDashboard;
