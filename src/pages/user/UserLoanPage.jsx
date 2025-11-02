import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Accordion, Table, Badge } from 'react-bootstrap';
import AppNavbar from '../../components/Navbar'; // Your existing Navbar
import Footer from '../../components/Footer';   // Your existing Footer

// --- BACKEND API LOGIC (included in this file as requested) ---

const LOAN_API_URL = 'http://localhost:9007/api/loans'; // Your Loan Service URL

const getAuthHeader = () => {
    const authData = JSON.parse(localStorage.getItem("user"));
    const token = authData?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const applyForLoanAPI = (loanData) => {
    return axios.post(`${LOAN_API_URL}/apply`, loanData, { headers: getAuthHeader() });
};

const getLoansByUserIdAPI = (userId) => {
    return axios.get(`${LOAN_API_URL}/user/${userId}`, { headers: getAuthHeader() });
};

const getLoanDetailsWithEmisAPI = (loanId) => {
    return axios.get(`${LOAN_API_URL}/${loanId}`, { headers: getAuthHeader() });
};

const payEmiAPI = (emiId, paymentData) => {
    console.log("Paying EMI with data:", paymentData);
    return axios.post(`${LOAN_API_URL}/emi/${emiId}/pay`, paymentData, { headers: getAuthHeader() });
};

const forecloseLoanAPI = (loanId, foreclosureData) => {
    return axios.post(`${LOAN_API_URL}/${loanId}/foreclose`, foreclosureData, { headers: getAuthHeader() });
};


// --- REACT COMPONENT ---

const UserLoanPage = () => {
    const authData = JSON.parse(localStorage.getItem("user"));
    const userId = authData?.user?.id;
    // Assuming the user's primary account ID is stored in auth data
    const userAccountId = authData?.user?.accountId;

    // State for existing loans
    const [loans, setLoans] = useState([]);
    const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
    
    // State for user feedback
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // State for the new loan application form
    const [principal, setPrincipal] = useState('');
    const [tenureMonths, setTenureMonths] = useState('12');
    const [loanType, setLoanType] = useState('PERSONAL');

    // Fetch user's loans when the component mounts
    const fetchUserLoans = async () => {
        if (!userId) return;
        try {
            const response = await getLoansByUserIdAPI(userId);
            setLoans(response.data);
        } catch (err) {
            setError('Failed to fetch your loans. Please try again later.');
        }
    };

    useEffect(() => {
        fetchUserLoans();
    }, [userId]);

    // Handle clicking on a loan to view its details
    const handleLoanSelect = async (loanId) => {
        if (selectedLoanDetails?.id === loanId) {
            setSelectedLoanDetails(null); // Toggle view off
            return;
        }
        try {
            const response = await getLoanDetailsWithEmisAPI(loanId);
            setSelectedLoanDetails(response.data);
            setMessage('');
            setError('');
        } catch (err) {
            setError('Failed to load loan details.');
            setSelectedLoanDetails(null);
        }
    };

    // Handle the submission of the new loan application form
    const handleApplyLoan = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const loanData = {
                userId,
                accountId: userAccountId,
                principal,
                interestRate: 8.5, 
                tenureMonths,
                loanType
            };
            await applyForLoanAPI(loanData);
            setMessage('Loan application submitted successfully!');
            // Reset form and refresh loan list
            setPrincipal('');
            await fetchUserLoans();
        } catch (err) {
            setError('Failed to submit loan application.');
        }
    };

    // Handle paying a single EMI
    const handlePayEmi = async (emiId, loanId) => {
        try {
            await payEmiAPI(emiId, { paymentFromAccountId: userAccountId });
            setMessage(`EMI payment successful.`);
            const response = await getLoanDetailsWithEmisAPI(loanId);
            setSelectedLoanDetails(response.data); // Refresh details
            await fetchUserLoans(); // Refresh the main loan list status
        } catch (err) {
            setError('EMI payment failed. Please check your balance.');
        }
    };

    const handleForeclose = async (loanId) => {
        if (window.confirm("Are you sure you want to foreclose this loan? The outstanding amount will be debited from your account.")) {
            try {
                await forecloseLoanAPI(loanId, { paymentFromAccountId: userAccountId });
                setMessage('Loan has been successfully foreclosed.');
                await fetchUserLoans();
                setSelectedLoanDetails(null);
            } catch (err) {
                setError('Failed to foreclose loan.');
            }
        }
    };

    return (
        <>
            <AppNavbar />
            <Container className="py-5">
                {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                {/* --- Section 1: Apply for a Loan --- */}
                <Card className="mb-5 shadow-sm">
                    <Card.Header as="h3">Apply for a New Loan</Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleApplyLoan}>
                            <Form.Group className="mb-3">
                                <Form.Label>Loan Type</Form.Label>
                                <Form.Select value={loanType} onChange={e => setLoanType(e.target.value)}>
                                    <option value="PERSONAL">Personal Loan</option>
                                    <option value="HOME">Home Loan</option>
                                    <option value="VEHICLE">Vehicle Loan</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Loan Amount (Principal)</Form.Label>
                                <Form.Control type="number" value={principal} onChange={e => setPrincipal(e.target.value)} required min="1000" placeholder="e.g., 50000" />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Tenure (in Months)</Form.Label>
                                <Form.Control type="number" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} required min="6" />
                            </Form.Group>
                            <Button variant="primary" type="submit">Submit Application</Button>
                        </Form>
                    </Card.Body>
                </Card>

                {/* --- Section 2: View My Loans --- */}
                <h3 className="mb-3">My Loans</h3>
                <Accordion>
                    {loans.map(loan => (
                        <Accordion.Item eventKey={loan.id.toString()} key={loan.id}>
                            <Accordion.Header onClick={() => handleLoanSelect(loan.id)}>
                                Loan ID: {loan.id} | {loan.loanType} Loan for ₹{loan.principal.toFixed(2)} | Status: <Badge bg={loan.status === 'ACTIVE' ? 'success' : 'secondary'}>{loan.status}</Badge>
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
                                                        <td>{emi.installmentNumber}</td>
                                                        <td>{new Date(emi.dueDate).toLocaleDateString()}</td>
                                                        <td>₹{emi.amount.toFixed(2)}</td>
                                                        <td><Badge bg={emi.status === 'PAID' ? 'success' : 'warning'}>{emi.status}</Badge></td>
                                                        <td>{emi.status === 'UPCOMING' && <Button size="sm" onClick={() => handlePayEmi(emi.id, loan.id)}>Pay Now</Button>}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        {loan.status === 'ACTIVE' && <Button variant="danger" onClick={() => handleForeclose(loan.id)}>Foreclose Loan</Button>}
                                    </>
                                ) : <p>Loading details...</p>}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
                {loans.length === 0 && <p>You have no active or pending loan applications.</p>}
            </Container>
            <Footer />
        </>
    );
};

export default UserLoanPage;
