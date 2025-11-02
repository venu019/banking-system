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

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
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
        } else {
            setIsLoading(false); // No accounts, stop loading
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
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError("");
      try {
        const config = { headers: { Authorization: `Bearer ${authData.accessToken}` } };
        
        const params = new URLSearchParams();
        if (startDate) params.append('start', startDate);
        if (endDate) params.append('end', endDate);
        
        const response = await axios.get(`${TRANSACTIONS_API_URL}/account/${selectedAccount.id}?${params.toString()}`, config);
        setTransactions(response.data);
        console.log("Fetched transactions:", response.data);
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
    printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
    printWindow.document.write(`<style>
        body { padding: 2rem; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; } 
        .statement-header { margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem; } 
        h1 { color: ${brandColors.navy}; }
        .table { font-size: 0.9rem; } 
        th { background-color: ${brandColors.lightGray}; }
    </style>`);
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
      <style>{`
        .statement-table-container {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-hover tbody tr:hover {
          background-color: rgba(1, 33, 105, 0.05);
          cursor: default;
        }
        .table thead th {
          background-color: ${brandColors.navy};
          color: white;
          border-color: ${brandColors.red};
          border-bottom-width: 2px;
        }
        .btn-primary-custom {
            background-color: ${brandColors.navy};
            border-color: ${brandColors.navy};
            transition: all 0.3s ease;
        }
        .btn-primary-custom:hover {
            background-color: ${brandColors.red};
            border-color: ${brandColors.red};
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>

      <AppNavbar />
      <div className="container py-5">
        <h1 className="display-5 fw-bold mb-4" style={{ color: brandColors.navy }}>Account Statements</h1>

        {/* --- CONTROLS --- */}
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex flex-column flex-md-row flex-wrap align-items-md-end gap-3">
            <div className="flex-grow-1">
              <label htmlFor="accountSelector" className="form-label fw-semibold">Select Account</label>
              <select id="accountSelector" className="form-select form-select-lg" onChange={(e) => handleAccountChange(e.target.value)} value={selectedAccount?.id || ''} disabled={accounts.length === 0}>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType.replace('_', ' ')} - {acc.accountNo} (Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="form-label fw-semibold">From</label>
              <input type="date" id="startDate" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="endDate" className="form-label fw-semibold">To</label>
              <input type="date" id="endDate" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <button className="btn btn-primary-custom text-white" onClick={handlePrint} disabled={transactions.length === 0}>
                <i className="bi bi-printer me-2"></i>Print Statement
              </button>
            </div>
          </div>
        </div>

        {/* --- STATEMENT DISPLAY --- */}
        {isLoading && <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
        {error && <div className="alert alert-danger">{error}</div>}
        
        {!isLoading && !error && (
            <div className="card shadow-sm statement-table-container">
                <div className="card-body">
                    <div id="printable-statement">
                        <div className="statement-header d-none d-print-block text-center mb-4">
                            <h1 style={{color: brandColors.navy}}>NeoBank</h1>
                            <h4>Account Statement</h4>
                            <hr/>
                            <div className="text-start">
                                <p><strong>Client:</strong> {authData?.user?.name}</p>
                                <p><strong>Account:</strong> {selectedAccount?.accountNo} ({selectedAccount?.accountType.replace('_', ' ')})</p>
                                <p><strong>Period:</strong> {startDate || 'Beginning'} to {endDate || 'Today'}</p>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th className="text-end">Debit</th>
                                    <th className="text-end">Credit</th>
                                    <th className="text-end">Balance</th>
                                </tr>
                                </thead>
                                <tbody>
                                {transactions.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center text-muted p-4">No transactions found for the selected period.</td></tr>
                                ) : (
                                    transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td>{new Date(tx.transactionTime).toLocaleDateString()}</td>
                                        <td>{tx.merchant || tx.description || 'Self-Initiated Transfer'}</td>
                                        <td className="text-end text-danger fw-semibold">
                                            {tx.transactionType === 'DEBIT' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount) : ''}
                                        </td>
                                        <td className="text-end text-success fw-semibold">
                                            {tx.transactionType === 'CREDIT' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount) : ''}
                                        </td>
                                        <td className="text-end fw-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.postTransactionBalance)}</td>
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="text-end mt-3 fw-bold d-none d-print-block">
                            <h5 style={{color: brandColors.navy}}>Closing Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(closingBalance)}</h5>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Statements;
