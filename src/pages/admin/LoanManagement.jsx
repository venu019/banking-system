import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Alert, Modal, Badge, Tabs, Tab } from 'react-bootstrap';
import AppNavbar from '../../components/Navbar'; // Your existing Navbar
import Footer from '../../components/Footer';   // Your existing Footer

// --- BACKEND API LOGIC ---

const LOAN_API_URL = 'http://localhost:9007/api/loans';

const getAuthHeader = () => {
    const authData = JSON.parse(localStorage.getItem("user"));
    const token = authData?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const getAllLoansAPI = () => {
    return axios.get(LOAN_API_URL, { headers: getAuthHeader() });
};

const approveLoanAPI = (loanId) => {
    return axios.post(`${LOAN_API_URL}/${loanId}/approve`, {}, { headers: getAuthHeader() });
};

const getLoanDetailsWithEmisAPI = (loanId) => {
    return axios.get(`${LOAN_API_URL}/${loanId}`, { headers: getAuthHeader() });
};

// --- REACT COMPONENT ---

const LoanManagementPage = () => {
    const [allLoans, setAllLoans] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // State for the EMI modal
    const [showEmiModal, setShowEmiModal] = useState(false);
    const [selectedLoanForEmis, setSelectedLoanForEmis] = useState(null);

    const fetchAllLoans = async () => {
        setIsLoading(true);
        try {
            const response = await getAllLoansAPI();
            setAllLoans(response.data);
        } catch (err) {
            setError('Failed to fetch loan applications.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllLoans();
    }, []);

    const handleApprove = async (loanId) => {
        setMessage('');
        setError('');
        try {
            await approveLoanAPI(loanId);
            setMessage(`Loan ID #${loanId} approved successfully. It is now Active.`);
            fetchAllLoans(); // Refresh the list
        } catch (err) {
            setError(`Error approving loan ID #${loanId}.`);
        }
    };

    const handleViewEmis = async (loanId) => {
        try {
            const response = await getLoanDetailsWithEmisAPI(loanId);
            setSelectedLoanForEmis(response.data);
            setShowEmiModal(true);
        } catch (err) {
            setError('Failed to load EMIs for the selected loan.');
        }
    };

    const handleCloseModal = () => {
        setShowEmiModal(false);
        setSelectedLoanForEmis(null);
    };

    const pendingLoans = allLoans.filter(loan => loan.status === 'APPLIED');
    const activeLoans = allLoans.filter(loan => loan.status !== 'APPLIED');

    return (
        <>
            <AppNavbar />
            <Container className="py-5">
                <h2 className="mb-4">Loan Management Dashboard</h2>
                {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <Tabs defaultActiveKey="pending" id="loan-management-tabs" className="mb-3">
                    <Tab eventKey="pending" title={`Pending Approval (${pendingLoans.length})`}>
                        {isLoading ? <p>Loading...</p> : pendingLoans.length === 0 ? (
                            <Alert variant="info">No loans are currently pending approval.</Alert>
                        ) : (
                            <Table striped bordered hover responsive>
                                <thead className="table-dark">
                                    <tr><th>Loan ID</th><th>User ID</th><th>Amount</th><th>Type</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {pendingLoans.map(loan => (
                                        <tr key={loan.id}>
                                            <td>{loan.id}</td><td>{loan.userId}</td><td>₹{loan.principal.toFixed(2)}</td><td>{loan.loanType}</td>
                                            <td><Button variant="success" size="sm" onClick={() => handleApprove(loan.id)}>Approve</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Tab>
                    <Tab eventKey="history" title="Active & Closed Loans">
                        <Table striped bordered hover responsive>
                            <thead className="table-dark">
                                <tr><th>Loan ID</th><th>User ID</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {activeLoans.map(loan => (
                                    <tr key={loan.id}>
                                        <td>{loan.id}</td><td>{loan.userId}</td><td>₹{loan.principal.toFixed(2)}</td>
                                        <td><Badge bg={loan.status === 'ACTIVE' ? 'primary' : 'secondary'}>{loan.status}</Badge></td>
                                        <td><Button variant="info" size="sm" onClick={() => handleViewEmis(loan.id)}>View EMIs</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>
                </Tabs>

                {/* EMI Details Modal */}
                <Modal show={showEmiModal} onHide={handleCloseModal} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>EMI Schedule for Loan #{selectedLoanForEmis?.id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedLoanForEmis?.emis.length > 0 ? (
                            <Table striped bordered>
                                <thead>
                                    <tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {selectedLoanForEmis.emis.map(emi => (
                                        <tr key={emi.id}>
                                            <td>{emi.installmentNumber}</td><td>{new Date(emi.dueDate).toLocaleDateString()}</td>
                                            <td>₹{emi.amount.toFixed(2)}</td>
                                            <td><Badge bg={emi.status === 'PAID' ? 'success' : 'warning'}>{emi.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : <p>No EMI schedule found for this loan. It may have just been approved.</p>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </Container>
            <Footer />
        </>
    );
};

export default LoanManagementPage;
