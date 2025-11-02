import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Accordion, Table, Badge, Row, Col } from 'react-bootstrap';
import AppNavbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import 'bootstrap-icons/font/bootstrap-icons.css';

const LOAN_API_URL = 'http://localhost:9007/api/loans';
const ACCOUNTS_API_URL = 'http://localhost:9002/api/accounts';
const NOTIFICATION_API_URL = 'http://localhost:8082/api/notify/send';

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
};

const getAuthHeader = () => {
  const authData = JSON.parse(localStorage.getItem("user"));
  const token = authData?.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- API Calls ---
const applyForLoanAPI = (loanData) => axios.post(`${LOAN_API_URL}/apply`, loanData, { headers: getAuthHeader() });
const getLoansByUserIdAPI = (userId) => axios.get(`${LOAN_API_URL}/user/${userId}`, { headers: getAuthHeader() });
const getAccountsByUserIdAPI = (userId) => axios.get(`${ACCOUNTS_API_URL}/user/${userId}`, { headers: getAuthHeader() });
const getLoanDetailsWithEmisAPI = (loanId) => axios.get(`${LOAN_API_URL}/${loanId}`, { headers: getAuthHeader() });
const payEmiAPI = (emiId, paymentData) => axios.post(`${LOAN_API_URL}/emi/${emiId}/pay`, paymentData, { headers: getAuthHeader() });
const forecloseLoanAPI = (loanId, foreclosureData) => axios.post(`${LOAN_API_URL}/${loanId}/foreclose`, foreclosureData, { headers: getAuthHeader() });

// --- Notification Service ---
const sendNotification = async (to, subject, body) => {
  try {
    await axios.post(NOTIFICATION_API_URL, { to, subject, body }, { headers: getAuthHeader() });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

const currencyFormatter = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const UserLoanPage = () => {
  const authData = JSON.parse(localStorage.getItem("user"));
  const userId = authData?.user?.id;
  const userEmail = authData?.user?.email;

  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [principal, setPrincipal] = useState("");
  const [tenureMonths, setTenureMonths] = useState("12");
  const [loanType, setLoanType] = useState("PERSONAL");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const fetchInitialData = async () => {
    if (!userId) return;
    try {
      const [loansRes, accountsRes] = await Promise.all([
        getLoansByUserIdAPI(userId),
        getAccountsByUserIdAPI(userId)
      ]);
      setLoans(loansRes.data);
      setAccounts(accountsRes.data);
      if (accountsRes.data.length > 0) {
        setSelectedAccountId(accountsRes.data[0].id);
      }
    } catch (err) {
      setError("Failed to fetch your data.");
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [userId]);

  const handleLoanSelect = async (loanId) => {
    if (selectedLoanDetails?.id === loanId) {
      setSelectedLoanDetails(null);
      return;
    }
    try {
      const response = await getLoanDetailsWithEmisAPI(loanId);
      setSelectedLoanDetails(response.data);
      setMessage("");
      setError("");
    } catch (err) {
      setError("Failed to load loan details.");
    }
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    if (!selectedAccountId) {
        setError("Please select an account to link the loan to.");
        return;
    }
    setMessage("");
    setError("");
    try {
      const loanData = {
        userId: Number(userId),
        accountId: Number(selectedAccountId),
        loanType: loanType,
        principal: Number(principal),
        interestRate: 8.5,
        tenureMonths: Number(tenureMonths)
      };
      await applyForLoanAPI(loanData);
      setMessage("Loan application submitted successfully!");
      setPrincipal("");
      await fetchInitialData();

      const subject = "Your Loan Application has been Received";
      const body = `<p>Dear User,</p><p>We have received your application for a ${loanType} loan of ${currencyFormatter(principal)} for ${tenureMonths} months. It is now under review.</p>`;
      await sendNotification(userEmail, subject, body);
    } catch (err) {
      setError("Failed to submit loan application.");
    }
  };

  const handlePayEmi = async (emiId, loanId) => {
    if (!selectedAccountId) {
        setError("Please select a payment account.");
        return;
    }
    try {
      await payEmiAPI(emiId, { paymentFromAccountId: selectedAccountId });
      setMessage(`EMI payment successful.`);
      const response = await getLoanDetailsWithEmisAPI(loanId);
      setSelectedLoanDetails(response.data);
      await fetchInitialData();

      const loan = loans.find(l => l.id === loanId);
      const emi = selectedLoanDetails.emis.find(e => e.id === emiId);
      const subject = `EMI Payment Successful for Loan #${loanId}`;
      const body = `<p>Dear User,</p><p>Your EMI payment of ${currencyFormatter(emi.amount)} for Loan #${loanId} was successful.</p>`;
      await sendNotification(userEmail, subject, body);
    } catch (err) {
      setError("EMI payment failed. Please check your balance.");
    }
  };

  const handleForeclose = async (loanId) => {
    if (!selectedAccountId) {
        setError("Please select a payment account.");
        return;
    }
    if (window.confirm("Are you sure you want to foreclose this loan? The outstanding amount will be debited from your account.")) {
      try {
        await forecloseLoanAPI(loanId, { paymentFromAccountId: selectedAccountId });
        setMessage("Loan has been successfully foreclosed.");
        await fetchInitialData();
        setSelectedLoanDetails(null);

        const loan = loans.find(l => l.id === loanId);
        const subject = `Loan #${loanId} Has Been Foreclosed`;
        const body = `<p>Dear User,</p><p>Your ${loan.loanType} loan of ${currencyFormatter(loan.principal)} has been successfully foreclosed.</p>`;
        await sendNotification(userEmail, subject, body);
      } catch (err) {
        setError("Failed to foreclose loan.");
      }
    }
  };

  return (
    <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh' }}>
      <AppNavbar />
      <Container className="py-5">
        <div className="text-center mb-5">
            <h1 className="display-5 fw-bold" style={{ color: brandColors.navy }}>Loan Center</h1>
            <p className="lead text-muted">Apply for new loans and manage your existing EMIs with ease.</p>
        </div>

        {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        <Card className="mb-5 shadow border-0">
          <Card.Header className="p-3" style={{backgroundColor: brandColors.navy, color: 'white'}}>
            <h4 className="mb-0"><i className="bi bi-pencil-square me-2"></i>Apply for a New Loan</h4>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleApplyLoan}>
              <Row>
                <Col md={3}><Form.Group className="mb-3"><Form.Label>Loan Type</Form.Label><Form.Select value={loanType} onChange={e => setLoanType(e.target.value)}><option value="PERSONAL">Personal Loan</option><option value="HOME">Home Loan</option><option value="VEHICLE">Vehicle Loan</option></Form.Select></Form.Group></Col>
                <Col md={3}><Form.Group className="mb-3"><Form.Label>Loan Amount (Principal)</Form.Label><Form.Control type="number" value={principal} onChange={e => setPrincipal(e.target.value)} required min="1000" placeholder="e.g., 50000" /></Form.Group></Col>
                <Col md={3}><Form.Group className="mb-3"><Form.Label>Tenure (Months)</Form.Label><Form.Control type="number" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} required min="6" /></Form.Group></Col>
                <Col md={3}><Form.Group className="mb-3"><Form.Label>Link to Account</Form.Label><Form.Select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} required disabled={accounts.length === 0}>{accounts.length > 0 ? accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.accountNo} - {acc.accountType}</option>)) : (<option>No accounts available</option>)}</Form.Select></Form.Group></Col>
              </Row>
              <div className="text-end"><Button variant="danger" type="submit" disabled={accounts.length === 0}>Submit Application</Button></div>
            </Form>
          </Card.Body>
        </Card>

        <h3 className="mb-3 fw-bold" style={{color: brandColors.navy}}>My Loan Portfolio</h3>
        <Accordion className="loan-accordion">
          {loans.map(loan => (
            <Accordion.Item eventKey={loan.id.toString()} key={loan.id}>
              <Accordion.Header onClick={() => handleLoanSelect(loan.id)}>
                <div className="d-flex justify-content-between w-100 me-3">
                  <span>{loan.loanType.replace('_', ' ')} Loan - {currencyFormatter(loan.principal)}</span>
                  <Badge pill bg={loan.status === 'ACTIVE' ? 'success' : 'secondary'}>{loan.status}</Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {selectedLoanDetails?.id === loan.id ? (
                  <>
                    <h5 className="mb-3">EMI Schedule</h5>
                    <Table striped bordered hover responsive>
                      <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {selectedLoanDetails.emis.map(emi => (
                          <tr key={emi.id}>
                            <td>{emi.installmentNumber}</td><td>{new Date(emi.dueDate).toLocaleDateString()}</td><td>{currencyFormatter(emi.amount)}</td>
                            <td><Badge pill bg={emi.status === 'PAID' ? 'success' : 'warning'}>{emi.status}</Badge></td>
                            <td>{emi.status === 'UPCOMING' && <Button variant="outline-success" size="sm" onClick={() => handlePayEmi(emi.id, loan.id)}>Pay Now</Button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {loan.status === 'ACTIVE' && <div className="text-end mt-3"><Button variant="outline-danger" onClick={() => handleForeclose(loan.id)}>Foreclose Loan</Button></div>}
                  </>
                ) : <div className="text-center p-3"><span className="spinner-border spinner-border-sm"></span> Loading details...</div>}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
        {loans.length === 0 && <div className="text-center p-5 bg-light rounded text-muted">You have no active or pending loan applications.</div>}
      </Container>
      <Footer />
      <style>{`
        .loan-accordion .accordion-button { font-weight: 600; }
        .loan-accordion .accordion-button:not(.collapsed) { background-color: rgba(1, 33, 105, 0.05); color: ${brandColors.navy}; }
      `}</style>
    </div>
  );
};

export default UserLoanPage;
