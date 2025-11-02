import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from "react-router-dom";
import AppNavbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import 'bootstrap-icons/font/bootstrap-icons.css';

const BRANCHES_API_URL = 'http://localhost:9003/api/branches';

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837',
  lightGray: '#f8f9fa'
};

const BranchManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state for both create and edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  
  const [formData, setFormData] = useState({
    branchName: '',
    ifscCode: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    email: '',
    phoneNumber: ''
  });

  const fetchBranches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
      if (!token) {
        navigate("/login");
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await axios.get(BRANCHES_API_URL, { headers });
      setBranches(res.data);
    } catch (err) {
      setError('Failed to load branches. Please ensure you are logged in with admin privileges.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [navigate]);

  const handleShowCreateModal = () => {
    setIsEditing(false);
    setEditingBranchId(null);
    setFormData({
      branchName: '', ifscCode: '', street: '', city: '', state: '',
      postalCode: '', country: 'India', email: '', phoneNumber: ''
    });
    setShowModal(true);
  };

  const handleShowEditModal = (branch) => {
    setIsEditing(true);
    setEditingBranchId(branch.id);
    setFormData({
      branchName: branch.branchName,
      ifscCode: branch.ifscCode,
      street: branch.address.street,
      city: branch.address.city,
      state: branch.address.state,
      postalCode: branch.address.postalCode,
      country: branch.address.country,
      email: branch.contact.email,
      phoneNumber: branch.contact.phoneNumber
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingBranchId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
      if (!token) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };

      const payload = {
        branchName: formData.branchName,
        ifscCode: formData.ifscCode,
        address: {
          street: formData.street, city: formData.city, state: formData.state,
          postalCode: formData.postalCode, country: formData.country
        },
        contact: { email: formData.email, phoneNumber: formData.phoneNumber }
      };

      if (isEditing) {
        await axios.put(`${BRANCHES_API_URL}/${editingBranchId}`, payload, { headers });
        setSuccess('Branch updated successfully!');
      } else {
        await axios.post(BRANCHES_API_URL, payload, { headers });
        setSuccess('Branch created successfully!');
      }
      handleCloseModal();
      fetchBranches();
    } catch (err) {
      setError(isEditing ? 'Failed to update the branch.' : 'Failed to create the branch.');
    }
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) return;
    
    setError('');
    setSuccess('');
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
      if (!token) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.delete(`${BRANCHES_API_URL}/${branchId}`, { headers });
      setSuccess('Branch deleted successfully!');
      fetchBranches();
    } catch (err) {
      setError('Failed to delete the branch. It may be linked to existing accounts.');
    }
  };

  return (
    <div style={{ backgroundColor: brandColors.lightGray, minHeight: '100vh' }}>
      <AppNavbar />
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="fw-bold" style={{ color: brandColors.navy }}>Branch Management</h1>
            <Button variant="primary" onClick={handleShowCreateModal} className="btn-main">
                <i className="bi bi-plus-circle me-2"></i>Create New Branch
            </Button>
        </div>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        <div className="card shadow-sm">
            <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                    <thead><tr><th>Branch Name</th><th>IFSC</th><th>City</th><th>Actions</th></tr></thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="4" className="text-center p-5">Loading...</td></tr>
                        ) : branches.length > 0 ? branches.map(branch => (
                            <tr key={branch.id}>
                                <td>{branch.branchName}</td>
                                <td>{branch.ifscCode}</td>
                                <td>{branch.address.city}</td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <Button variant="outline-primary" onClick={() => handleShowEditModal(branch)}><i className="bi bi-pencil-fill"></i></Button>
                                        <Button variant="outline-danger" onClick={() => handleDelete(branch.id)}><i className="bi bi-trash-fill"></i></Button>
                                        <Link to={`/admin/bank-dashboard?branchId=${branch.id}`} className="btn btn-outline-secondary"><i className="bi bi-gear-fill"></i></Link>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center p-5 text-muted">No branches created yet.</td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </div>

        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton style={{backgroundColor: brandColors.navy, color: 'white'}}>
            <Modal.Title><i className="bi bi-bank2 me-2"></i>{isEditing ? 'Edit Branch' : 'Create New Branch'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Branch Name</Form.Label><Form.Control type="text" name="branchName" value={formData.branchName} onChange={handleChange} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>IFSC Code</Form.Label><Form.Control type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} required /></Form.Group></Col>
              </Row>
              <Form.Group className="mb-3"><Form.Label>Street</Form.Label><Form.Control type="text" name="street" value={formData.street} onChange={handleChange} required /></Form.Group>
              <Row>
                  <Col md={4}><Form.Group className="mb-3"><Form.Label>City</Form.Label><Form.Control type="text" name="city" value={formData.city} onChange={handleChange} required /></Form.Group></Col>
                  <Col md={4}><Form.Group className="mb-3"><Form.Label>State</Form.Label><Form.Control type="text" name="state" value={formData.state} onChange={handleChange} required /></Form.Group></Col>
                  <Col md={4}><Form.Group className="mb-3"><Form.Label>Postal Code</Form.Label><Form.Control type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required /></Form.Group></Col>
              </Row>
              <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Contact Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Contact Phone</Form.Label><Form.Control type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required /></Form.Group></Col>
              </Row>
              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" onClick={handleCloseModal} className="me-2">Cancel</Button>
                <Button variant="primary" type="submit" className="btn-main">{isEditing ? 'Update Branch' : 'Create Branch'}</Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
      <Footer />
      <style>{`
        thead th { background-color: ${brandColors.navy}; color: white; }
        .table-hover tbody tr:hover { background-color: rgba(1, 33, 105, 0.03); }
        .btn-main { background-color: ${brandColors.navy}; border-color: ${brandColors.navy}; }
        .btn-main:hover { background-color: ${brandColors.red}; border-color: ${brandColors.red}; }
      `}</style>
    </div>
  );
};

export default BranchManagement;
