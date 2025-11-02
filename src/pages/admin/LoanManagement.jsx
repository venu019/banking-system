import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Alert, Modal, Badge, Tabs, Tab, Spinner } from 'react-bootstrap';
import AppNavbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import 'bootstrap-icons/font/bootstrap-icons.css';

const LOAN_API_URL = 'http://localhost:9007/api/loans';

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

const getAllLoansAPI = () => {
    return axios.get(LOAN_API_URL, { headers: getAuthHeader() });
};

const approveLoanAPI = (loanId) => {
    return axios.post(`${LOAN_API_URL}/${loanId}/approve`, {}, { headers: getAuthHeader() });
};

const getLoanDetailsWithEmisAPI = (loanId) => {
    return axios.get(`${LOAN_API_URL}/${loanId}`, { headers: getAuthHeader() });
};

const LoanManagementPage = () => {
    const [allLoans, setAllLoans] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [showEmiModal, setShowEmiModal] = useState(false);
    const [selectedLoanForEmis, setSelectedLoanForEmis] = useState(null);

    const fetchAllLoans = async () => {
        setIsLoading(true);
        try {
            const response = await getAllLoansAPI();
            setAllLoans(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch loan applications. Please ensure you are logged in with admin privileges.');
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
            setMessage(`Loan ID #${loanId} approved successfully and is now ACTIVE.`);
            fetchAllLoans();
        } catch (err) {
            setError(`Error approving loan ID #${loanId}. It may have already been processed.`);
        }
    };

    const handleViewEmis = async (loanId) => {
        try {
            const response = await getLoanDetailsWithEmisAPI(loanId);
            setSelectedLoanForEmis(response.data);
            setShowEmiModal(true);
        } catch (err) {
            setError('Failed to load the EMI schedule for the selected loan.');
        }
    };

    const handleCloseModal = () => {
        setShowEmiModal(false);
        setSelectedLoanForEmis(null);
    };

    const pendingLoans = allLoans.filter(loan => loan.status === 'APPLIED');
    const otherLoans = allLoans.filter(loan => loan.status !== 'APPLIED');

    return (
        <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh' }}>
            <AppNavbar />
            <Container className="py-5">
                <div className="text-center mb-5">
                    <h1 className="display-5 fw-bold" style={{ color: brandColors.navy }}>Loan Management</h1>
                    <p className="lead text-muted">Review, approve, and track all loan applications.</p>
                </div>
                
                {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <Tabs defaultActiveKey="pending" id="loan-management-tabs" className="mb-4 loan-tabs">
                    <Tab eventKey="pending" title={<><i className="bi bi-clock-history me-2"></i>Pending Approval <Badge pill bg="danger">{pendingLoans.length}</Badge></>}>
                        <div className="card shadow-sm">
                            {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : pendingLoans.length === 0 ? (
                                <Alert variant="light" className="m-3 text-center">No loans are currently pending approval.</Alert>
                            ) : (
                                <Table hover responsive className="mb-0">
                                    <thead><tr><th>Loan ID</th><th>User ID</th><th>Amount</th><th>Type</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {pendingLoans.map(loan => (
                                            <tr key={loan.id}>
                                                <td>{loan.id}</td><td>{loan.userId}</td><td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(loan.principal)}</td><td>{loan.loanType.replace('_', ' ')}</td>
                                                <td><Button variant="outline-success" size="sm" onClick={() => handleApprove(loan.id)}>Approve</Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </div>
                    </Tab>
                    <Tab eventKey="history" title={<><i className="bi bi-check-circle me-2"></i>Active & Closed Loans</>}>
                        <div className="card shadow-sm">
                            {isLoading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
                                <Table hover responsive className="mb-0">
                                    <thead><tr><th>Loan ID</th><th>User ID</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {otherLoans.map(loan => (
                                            <tr key={loan.id}>
                                                <td>{loan.id}</td><td>{loan.userId}</td><td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(loan.principal)}</td>
                                                <td><Badge pill bg={loan.status === 'ACTIVE' ? 'primary' : 'secondary'}>{loan.status}</Badge></td>
                                                <td><Button variant="outline-info" size="sm" onClick={() => handleViewEmis(loan.id)}>View EMIs</Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </div>
                    </Tab>
                </Tabs>

                <Modal show={showEmiModal} onHide={handleCloseModal} size="lg" centered>
                    <Modal.Header closeButton style={{backgroundColor: brandColors.navy, color: 'white'}}>
                        <Modal.Title>EMI Schedule for Loan #{selectedLoanForEmis?.id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedLoanForEmis?.emis.length > 0 ? (
                            <Table striped bordered>
                                <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {selectedLoanForEmis.emis.map(emi => (
                                        <tr key={emi.id}>
                                            <td>{emi.installmentNumber}</td><td>{new Date(emi.dueDate).toLocaleDateString()}</td>
                                            <td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(emi.amount)}</td>
                                            <td><Badge pill bg={emi.status === 'PAID' ? 'success' : 'warning'}>{emi.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : <p className="text-center text-muted p-3">No EMI schedule has been generated for this loan yet.</p>}
                    </Modal.Body>
                </Modal>
            </Container>
            <Footer />
            <style>{`
                thead th { background-color: ${brandColors.navy}; color: white; border-bottom: 2px solid ${brandColors.red}; }
                .table-hover tbody tr:hover { background-color: rgba(1, 33, 105, 0.03); }
                .loan-tabs .nav-link { color: ${brandColors.navy}; font-weight: 600; }
                .loan-tabs .nav-link.active { color: ${brandColors.red}; border-bottom-color: ${brandColors.red}; }
            `}</style>
        </div>
    );
};

export default LoanManagementPage;
