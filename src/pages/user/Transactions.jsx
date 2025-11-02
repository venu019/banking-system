import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// API Endpoints
const ACCOUNTS_API_URL = "http://localhost:9002/api/accounts";
const TRANSACTIONS_API_URL = "http://localhost:9005/transactions";

const getAuthData = () => {
  return JSON.parse(localStorage.getItem("user"));
};

function Statements() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const authData = getAuthData();

  // Initial data load for accounts
  useEffect(() => {
    if (!authData?.user) {
      navigate("/login");
      return;
    }

    const fetchAccounts = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${authData.accessToken}` } };
        const response = await axios.get(`${ACCOUNTS_API_URL}/user/${authData.user.id}`, config);
        setAccounts(response.data);
        if (response.data.length > 0) {
          setSelectedAccount(response.data[0]);
        }
      } catch (err) {
        setError("Failed to load accounts. Please ensure the Account Service is running.");
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [navigate]);

  // Fetch transactions when selected account or date range changes
  useEffect(() => {
    if (!selectedAccount) {
        setIsLoading(false);
        return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const config = { headers: { Authorization: `Bearer ${authData.accessToken}` } };
        
        // Build URL with optional date parameters
        const params = new URLSearchParams();
        if (startDate) params.append('start', startDate);
        if (endDate) params.append('end', endDate);
        
        const response = await axios.get(`${TRANSACTIONS_API_URL}/account/${selectedAccount.id}?${params.toString()}`, config);
        setTransactions(response.data);
      } catch (err) {
        setError("Failed to fetch transactions for the selected account and date range.");
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedAccount, startDate, endDate]);

  const handleAccountChange = (accountId) => {
    const account = accounts.find(acc => acc.id.toString() === accountId);
    setSelectedAccount(account);
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Account Statement</title>');
    // Add Bootstrap for styling
    printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
    printWindow.document.write('<style>body { padding: 2rem; } .statement-header { margin-bottom: 2rem; } .table { font-size: 0.9rem; } h1, h4, h5 { font-family: sans-serif; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(document.getElementById("printable-statement").innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  };

  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].postTransactionBalance : selectedAccount?.balance;

  return (
    <>
      <AppNavbar />
      <div className="container py-5">
        <h2 className="mb-4">Account Statements</h2>

        {/* --- CONTROLS --- */}
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex flex-wrap align-items-center gap-3">
            <div className="flex-grow-1">
              <label htmlFor="accountSelector" className="form-label">Select Account</label>
              <select id="accountSelector" className="form-select" onChange={(e) => handleAccountChange(e.target.value)} disabled={accounts.length === 0}>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType} - {acc.accountNo} (Balance: ₹{acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="form-label">From</label>
              <input type="date" id="startDate" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="endDate" className="form-label">To</label>
              <input type="date" id="endDate" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="align-self-end">
              <button className="btn btn-primary" onClick={handlePrint} disabled={transactions.length === 0}>
                Print Statement
              </button>
            </div>
          </div>
        </div>

        {/* --- STATEMENT DISPLAY --- */}
        {isLoading && <p className="text-center">Loading transactions...</p>}
        {error && <div className="alert alert-danger">{error}</div>}
        
        {!isLoading && !error && (
            <div id="printable-statement">
                {/* --- HEADER FOR PRINTING --- */}
                <div className="statement-header d-none d-print-block">
                    <h1 className="text-center">Your Bank Name</h1>
                    <h4 className="text-center">Account Statement</h4>
                    <hr/>
                    <div className="d-flex justify-content-between">
                        <div>
                            <strong>{authData?.user?.name}</strong><br/>
                            {authData?.user?.address || 'Your Address, City, Pincode'}
                        </div>
                        <div>
                            <strong>Account Number:</strong> {selectedAccount?.accountNo}<br/>
                            <strong>Account Type:</strong> {selectedAccount?.accountType}<br/>
                            <strong>Statement Period:</strong> {startDate || 'Start'} to {endDate || 'Today'}
                        </div>
                    </div>
                    <hr/>
                </div>

                {/* --- TABLE FOR UI AND PRINTING --- */}
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead className="table-light">
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th className="text-end">Debit</th>
                            <th className="text-end">Credit</th>
                            <th className="text-end">Balance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                            <td>{new Date(tx.transactionTime).toLocaleDateString()}</td>
                            <td>{tx.merchant || tx.counterpartyAccount || 'Self-Initiated'}</td>
                            <td className="text-end text-danger">
                                {tx.transactionType === 'DEBIT' ? `₹${tx.amount.toFixed(2)}` : ''}
                            </td>
                            <td className="text-end text-success">
                                {tx.transactionType === 'CREDIT' ? `₹${tx.amount.toFixed(2)}` : ''}
                            </td>
                            <td className="text-end">₹{tx.postTransactionBalance.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="text-end mt-3 d-none d-print-block">
                    <h5>Closing Balance: ₹{closingBalance?.toFixed(2)}</h5>
                </div>
            </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Statements;
