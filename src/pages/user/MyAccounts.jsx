import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import 'bootstrap-icons/font/bootstrap-icons.css';

// API endpoints
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const BANKS_API_URL = 'http://localhost:9003/api/branches';
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send';

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837'
};

function MyAccounts() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [banks, setBanks] = useState([]);
    const [bankMap, setBankMap] = useState(new Map());
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
                alert("Could not load account data. Please ensure backend services are running.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    const sendAccountCreatedNotification = async (account, userDetails, token) => {
        if (!userDetails || !userDetails.email) {
            console.error("Notification failed: User email is not available.");
            return;
        }
        const bank = bankMap.get(account.bankId);
        const subject = "Your New Bank Account Has Been Created!";
        const emailBody = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; padding: 40px; text-align: center;">
                <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <div style="background-color: #012169; color: white; padding: 20px;">
                        <h1 style="margin: 0; font-size: 24px;">Account Created Successfully</h1>
                    </div>
                    <div style="padding: 30px; text-align: left; color: #333;">
                        <h2 style="color: #E31837; margin-top: 0;">Welcome, ${userDetails.username}!</h2>
                        <p>We are delighted to inform you that your new bank account has been successfully created. Please find the details below:</p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Account Number:</td><td style="padding: 10px;">${account.accountNumber}</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Account Type:</td><td style="padding: 10px;">${account.accountType.replace('_', ' ')}</td></tr>
                                ${bank ? `
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px; font-weight: bold;">Branch Name:</td><td style="padding: 10px;">${bank.branchName}</td></tr>
                                <tr><td style="padding: 10px; font-weight: bold;">IFSC Code:</td><td style="padding: 10px;">${bank.ifscCode}</td></tr>
                                ` : ''}
                            </table>
                        </div>
                        <p>You can now start using your account for transactions. If you have any questions, please do not hesitate to contact our support team.</p>
                    </div>
                    <div style="background-color: #f1f1f1; padding: 15px; font-size: 12px; color: #666;">
                        This is an automated email. Please do not reply.
                    </div>
                </div>
            </div>
        `;

        try {
            await axios.post(NOTIFICATION_API_URL, {
                to: userDetails.email,
                subject: subject,
                body: emailBody,
            }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error("Failed to send account creation notification:", error);
            // Non-blocking error, so we don't alert the user
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
            
            await sendAccountCreatedNotification(newAccount, user, token);
            
            const modalElement = document.getElementById('newAccountModal');
            const modal = window.bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            setSelectedBankId('');
            setAccountType('SAVINGS');
            
            alert(`Account request submitted successfully! Account Number: ${newAccount.accountNumber}`);
        } catch (error) {
            console.error("Failed to create account:", error.response?.data || error.message);
            alert("Failed to create account. You may already have an account of this type. Please check the console for more details.");
        }
    };
    
    const viewTransactions = (acc) => navigate(`/services/transactions?accNo=${acc.accountNo}`);

    if (isLoading) {
        return <div className="d-flex vh-100 align-items-center justify-content-center">Loading Accounts...</div>;
    }

    return (
        <>
            <style>{`
                .account-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .account-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .account-card-header { background: linear-gradient(135deg, ${brandColors.navy}, ${brandColors.red}); color: white; }
            `}</style>

            <AppNavbar />
            <div className="container py-5">
                <section className="d-flex align-items-center justify-content-between mb-4">
                    <h1 className="fw-bold" style={{ color: brandColors.navy }}>My Accounts</h1>
                    <button className="btn btn-primary" style={{ backgroundColor: brandColors.red, borderColor: brandColors.red }} data-bs-toggle="modal" data-bs-target="#newAccountModal">
                        <i className="bi bi-plus-circle me-2"></i>Request New Account
                    </button>
                </section>

                {accounts.length === 0 ? (
                    <div className="text-center p-5 rounded" style={{backgroundColor: '#f8f9fa'}}>
                        <i className="bi bi-info-circle fs-1" style={{color: brandColors.navy}}></i>
                        <h4 className="mt-3">No Accounts Found</h4>
                        <p className="text-muted">Get started by requesting your first bank account with us.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {accounts.map((acc) => {
                            const bank = bankMap.get(acc.bankId);
                            return (
                                <div className="col-12" key={acc.id}>
                                    <div className="card border-0 shadow-sm rounded-3 account-card">
                                        <div className="card-header account-card-header p-4 rounded-top-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="mb-0 fw-bold">{acc.accountType.replace('_', ' ')} Account</h5>
                                                    <small>{bank ? bank.branchName : "Branch details not found"}</small>
                                                </div>
                                                <span className={`badge fs-6 ${acc.status === "ACTIVE" ? "bg-light text-success" : "bg-light text-secondary"}`}>{acc.status}</span>
                                            </div>
                                            <div className="mt-3">
                                                <small className="d-block opacity-75">Current Balance</small>
                                                <div className="fw-bolder" style={{ fontSize: '2rem' }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(acc.balance)}</div>
                                            </div>
                                        </div>
                                        <div className="card-body p-4">
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-4"><small className="text-muted d-block">Account Number</small><div className="fw-semibold">{acc.accountNumber}</div></div>
                                                <div className="col-md-4"><small className="text-muted d-block">IFSC Code</small><div className="fw-semibold">{bank ? bank.ifscCode : 'N/A'}</div></div>
                                                <div className="col-md-4"><small className="text-muted d-block">Date Opened</small><div className="fw-semibold">{new Date(acc.openedAt).toLocaleDateString()}</div></div>
                                                {bank && (
                                                    <div className="col-12">
                                                        <small className="text-muted d-block">Branch Address</small>
                                                        <div className="fw-semibold">{`${bank.address.street}, ${bank.address.city}, ${bank.address.state} - ${bank.address.postalCode}`}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => viewTransactions(acc)}>View Transactions</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="modal fade" id="newAccountModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header" style={{backgroundColor: brandColors.navy, color: 'white'}}>
                            <h5 className="modal-title">Request New Bank Account</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={createAccount} id="newAccountForm" className="row g-3 needs-validation">
                                <div className="col-12"><label className="form-label">Account Holder</label><input className="form-control" value={user?.username} disabled readOnly /></div>
                                <div className="col-12"><label htmlFor="bankId" className="form-label">Bank Branch</label><select id="bankId" className="form-select" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)} required><option value="" disabled>-- Select a Bank Branch --</option>{banks.map(bank => (<option key={bank.id} value={bank.id}>{bank.branchName}, {bank.address.city}</option>))}</select></div>
                                <div className="col-12"><label htmlFor="accountType" className="form-label">Account Type</label><select id="accountType" className="form-select" value={accountType} onChange={(e) => setAccountType(e.target.value)} required><option value="SAVINGS">Savings</option><option value="CURRENT">Current</option></select></div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" form="newAccountForm" className="btn btn-primary" style={{backgroundColor: brandColors.navy, borderColor: brandColors.navy}}>Submit Request</button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default MyAccounts;
