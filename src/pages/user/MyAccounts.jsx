import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// API endpoints
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const BANKS_API_URL = 'http://localhost:9003/api/branches';
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send'; // Notification Service Endpoint

function MyAccounts() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [banks, setBanks] = useState([]);
    const [bankMap, setBankMap] = useState(new Map());
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [selectedBankId, setSelectedBankId] = useState('');
    const [accountType, setAccountType] = useState('SAVINGS');

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
                const [accountsResponse, banksResponse] = await Promise.all([
                    axios.get(`${ACCOUNTS_API_URL}/user/${userDetails.id}`, { headers }),
                    axios.get(BANKS_API_URL, { headers })
                ]);
                
                const transformedAccounts = accountsResponse.data.map(acc => ({
                    ...acc,
                    accountNumber: acc.accountNo,
                    openedAt: acc.dateIssued
                }));
                setAccounts(transformedAccounts);

                const fetchedBanks = banksResponse.data;
                setBanks(fetchedBanks);
                const newBankMap = new Map(fetchedBanks.map(bank => [bank.id, bank]));
                setBankMap(newBankMap);

            } catch (error) {
                console.error("Failed to fetch initial account data:", error);
                alert("Could not load account data. Please ensure backend services are running and you are logged in correctly.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwtToken");
        navigate("/login");
    };

    // --- NEW: Function to send notification ---
    const sendAccountCreatedNotification = async (account, userDetails, token) => {
        const bank = bankMap.get(account.bankId);
        const emailBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Account Creation Successful!</h2>
                <p>Dear ${userDetails.username},</p>
                <p>We are pleased to inform you that your new bank account has been successfully created. Please find the details below:</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px;"><strong>Account Number:</strong></td><td style="padding: 8px;">${account.accountNumber}</td></tr>
                    <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px;"><strong>Account Type:</strong></td><td style="padding: 8px;">${account.accountType.replace('_', ' ')}</td></tr>
                    <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px;"><strong>Bank Branch:</strong></td><td style="padding: 8px;">${bank ? `${bank.branchName}, ${bank.address.city}` : 'N/A'}</td></tr>
                    <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px;"><strong>Date Opened:</strong></td><td style="padding: 8px;">${new Date(account.openedAt).toLocaleDateString()}</td></tr>
                    <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px;"><strong>Current Balance:</strong></td><td style="padding: 8px;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}</td></tr>
                </table>
                <p>Thank you for banking with us. You can now manage your account through our online portal.</p>
                <p>Best Regards,<br/>Your Bank</p>
            </div>
        `;

        const notificationPayload = {
            to: userDetails.email,
            subject: "Your New Bank Account Has Been Created Successfully",
            body: emailBody
        };

        try {
            await axios.post(NOTIFICATION_API_URL, notificationPayload, { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' // Explicitly set content type
                } 
            });
            console.log("Account creation notification email sent successfully.");
        } catch (error) {
            console.error("Failed to send account creation notification:", error.response?.data || error.message);
            // We don't alert the user here, as the primary action (account creation) was successful.
        }
    };

    const createAccount = async (e) => {
        e.preventDefault();
        if (!selectedBankId || !accountType) {
            return alert("Please select a bank and account type.");
        }

        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
        const payload = {
            userId: user.id,
            accountType,
            bankId: selectedBankId,
            initialBalance: 0,
        };

        try {
            const response = await axios.post(ACCOUNTS_API_URL, payload, { headers: { 'Authorization': `Bearer ${token}` } });
            
            const newAccount = { ...response.data, accountNumber: response.data.accountNo, openedAt: response.data.dateIssued };
            setAccounts([newAccount, ...accounts]);
            
            // --- CALL NOTIFICATION SERVICE ---
            await sendAccountCreatedNotification(newAccount, user, token);
            
            setShowForm(false);
            setSelectedBankId('');
            setAccountType('SAVINGS');
            
            alert(`Account request submitted successfully! Account Number: ${newAccount.accountNumber}`);
        } catch (error) {
            console.error("Failed to create account:", error.response?.data || error.message);
            alert("Failed to create account. Please check the console.");
        }
    };
    
    const viewStatements = (acc) => navigate(`/accounts/statements?acc=${acc.accountNo}`);
    const viewTransactions = (acc) => navigate(`/transactions?acc=${acc.accountNo}`);

    if (isLoading) {
        return <div className="text-center p-5">Loading Accounts...</div>;
    }

    return (
        <>
            <AppNavbar onLogout={handleLogout} />
            <div className="container py-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="mb-0">My Accounts</h2>
                    {!showForm && <button className="btn text-white" style={{ backgroundColor: "#000080" }} onClick={() => setShowForm(true)}>Request New Account</button>}
                </div>

                {showForm && (
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between"><h5 className="card-title mb-0">Request New Bank Account</h5><button className="btn btn-sm btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button></div>
                            <form onSubmit={createAccount} className="row g-3 needs-validation mt-2">
                                <div className="col-md-6"><label className="form-label">Account Holder</label><input className="form-control" value={user.username} disabled readOnly /></div>
                                <div className="col-md-6"><label htmlFor="bankId" className="form-label">Bank Branch</label><select id="bankId" className="form-select" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} required><option value="" disabled>-- Select a Bank Branch --</option>{banks.map(bank => (<option key={bank.id} value={bank.id}>{bank.branchName}, {bank.address.city}</option>))}</select></div>
                                <div className="col-md-6"><label htmlFor="accountType" className="form-label">Account Type</label><select id="accountType" className="form-select" value={accountType} onChange={(e) => setAccountType(e.target.value)} required><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option><option value="SALARY">Salary</option><option value="FIXED_DEPOSIT">Fixed Deposit</option></select></div>
                                <div className="col-12 d-flex justify-content-end"><button type="submit" className="btn text-white" style={{ backgroundColor: "#000080" }}>Submit Request</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {accounts.length === 0 ? (
                    <div className="card border-0 shadow-sm"><div className="card-body"><p className="mb-0">No accounts found. Click "Request New Account" to get started.</p></div></div>
                ) : (
                    <div className="row g-3">
                        {accounts.map((acc) => {
                            const bank = bankMap.get(acc.bankId);
                            return (
                                <div className="col-12" key={acc.id}>
                                    <div className="card border-0 shadow-lg">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: "#e8ecff", color: "#000080" }}><i className="bi bi-bank2" /></div>
                                                    <div>
                                                        <h6 className="mb-0">{acc.accountType.replace('_', ' ')} Account</h6>
                                                        <small className="text-muted">{bank ? bank.branchName : "Branch details not found"}</small>
                                                    </div>
                                                </div>
                                                <span className={`badge ${acc.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>{acc.status}</span>
                                            </div>
                                            <hr/>
                                            <div className="row g-3 mb-3">
                                                <div className="col-sm-6 col-md-4"><small className="text-muted d-block">Account Number</small><div className="fw-semibold text-truncate" title={acc.accountNumber}>{acc.accountNumber}</div></div>
                                                <div className="col-sm-6 col-md-4"><small className="text-muted d-block">IFSC Code</small><div className="fw-semibold text-truncate">{bank ? bank.ifscCode : 'N/A'}</div></div>
                                                <div className="col-sm-12 col-md-4"><small className="text-muted d-block">Date Opened</small><div className="fw-semibold text-truncate">{new Date(acc.openedAt).toLocaleDateString()}</div></div>
                                                {bank && (
                                                    <>
                                                        <div className="col-sm-12 col-md-8">
                                                            <small className="text-muted d-block">Branch Address</small>
                                                            <div className="fw-semibold text-truncate">{`${bank.address.street}, ${bank.address.city}, ${bank.address.state} - ${bank.address.postalCode}`}</div>
                                                        </div>
                                                        <div className="col-sm-12 col-md-4">
                                                            <small className="text-muted d-block">Branch Contact</small>
                                                            <div className="fw-semibold text-truncate">{bank.contact.email} | {bank.contact.phoneNumber}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between">
                                                <div>
                                                    <small className="text-muted d-block">Current Balance</small>
                                                    <div className="fw-bold" style={{ fontSize: 28, color: "#000080" }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(acc.balance)}</div>
                                                </div>
                                                <div className="d-flex gap-2 mt-2 mt-md-0">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => viewTransactions(acc)}>Transactions</button>
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => viewStatements(acc)}>Statements</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default MyAccounts;
