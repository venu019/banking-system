import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppNavbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:9003/api/branches'; // Your branch service port

const BranchManagement = () => {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentBranchId, setCurrentBranchId] = useState(null);
    const [formData, setFormData] = useState({
        branchName: '',
        ifscCode: '',
        address: { street: '', city: '', state: '', postalCode: '', country: 'India' },
        // Use phoneNumber to match the server response
        contact: { email: '', phoneNumber: '' }
    });

    const fetchBranches = async () => {
        try {
            const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
            if (!token) {
                navigate("/login");
                return;
            }
            const response = await axios.get(API_BASE_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBranches(response.data);
        } catch (err) {
            setError("Failed to fetch branches. Please ensure you have ADMIN rights.");
            console.error("Fetch branches error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwtToken");
        navigate("/login");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const [parent, child] = name.split('.');

        if (child) {
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentBranchId(null);
        setFormData({
            branchName: '',
            ifscCode: '',
            address: { street: '', city: '', state: '', postalCode: '', country: 'India' },
            contact: { email: '', phoneNumber: '' } // Reset with phoneNumber
        });
    };

    const handleEditClick = (branch) => {
        setIsEditing(true);
        setCurrentBranchId(branch.id);
        setFormData({
            branchName: branch.branchName,
            ifscCode: branch.ifscCode,
            address: branch.address,
            contact: branch.contact
        });
        window.scrollTo(0, 0);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
        const url = isEditing ? `${API_BASE_URL}/${currentBranchId}` : API_BASE_URL;
        const method = isEditing ? 'put' : 'post';

        try {
            await axios[method](url, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(`Branch successfully ${isEditing ? 'updated' : 'created'}!`);
            resetForm();
            fetchBranches();
        } catch (err) {
            alert(`Error: Could not ${isEditing ? 'update' : 'create'} branch.`);
            console.error("Submit error:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this branch?")) {
            try {
                const token = JSON.parse(localStorage.getItem("user"))?.accessToken;
                await axios.delete(`${API_BASE_URL}/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert("Branch deleted successfully.");
                fetchBranches(); 
            } catch (err) {
                alert("Error: Could not delete branch.");
                console.error("Delete error:", err.response?.data || err.message);
            }
        }
    };
    
    if (isLoading) {
        return <div className="text-center p-5">Loading branch data...</div>;
    }

    return (
        <>
            <AppNavbar /> {/* Removed onLogout as the navbar handles it */}
            <div className="container py-5">
                <h2 className="mb-4">Branch Management</h2>
                
                <div className="card shadow-sm mb-5">
                    <div className="card-header h5">
                        {isEditing ? 'Edit Branch' : 'Create New Branch'}
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="row g-4">
                                <div className="col-md-6"><label className="form-label">Branch Name</label><input type="text" className="form-control" name="branchName" value={formData.branchName} onChange={handleInputChange} required /></div>
                                <div className="col-md-6"><label className="form-label">IFSC Code</label><input type="text" className="form-control" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required /></div>
                                <div className="col-12"><hr/><h5 className="text-muted">Address</h5></div>
                                <div className="col-md-12"><label className="form-label">Street</label><input type="text" className="form-control" name="address.street" value={formData.address.street} onChange={handleInputChange} required /></div>
                                <div className="col-md-4"><label className="form-label">City</label><input type="text" className="form-control" name="address.city" value={formData.address.city} onChange={handleInputChange} required /></div>
                                <div className="col-md-4"><label className="form-label">State</label><input type="text" className="form-control" name="address.state" value={formData.address.state} onChange={handleInputChange} required /></div>
                                <div className="col-md-4"><label className="form-label">Postal Code</label><input type="text" className="form-control" name="address.postalCode" value={formData.address.postalCode} onChange={handleInputChange} required /></div>
                                <div className="col-12"><hr/><h5 className="text-muted">Contact</h5></div>
                                <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" name="contact.email" value={formData.contact.email} onChange={handleInputChange} required /></div>
                                
                                {/* --- CORRECTED PHONE INPUT --- */}
                                <div className="col-md-6">
                                    <label className="form-label">Phone</label>
                                    <input 
                                        type="tel" 
                                        className="form-control" 
                                        name="contact.phoneNumber" 
                                        value={formData.contact.phoneNumber} 
                                        onChange={handleInputChange} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-4">
                                {isEditing && <button type="button" className="btn btn-secondary me-2" onClick={resetForm}>Cancel Edit</button>}
                                <button type="submit" className="btn btn-primary">{isEditing ? 'Update Branch' : 'Create Branch'}</button>
                            </div>
                        </form>
                    </div>
                </div>

                <h3 className="mb-3">Existing Branches</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                {branches.length > 0 ? (
    <div className="list-group">
        {branches.map(branch => (
            <div key={branch.id} className="list-group-item list-group-item-action flex-column align-items-start">
                <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">{branch.branchName}</h5>
                    <small>ID: {branch.id}</small>
                </div>
                <p className="mb-1"><strong>IFSC:</strong> {branch.ifscCode} | <strong>Location:</strong> {branch.address.city}, {branch.address.state}</p>
                <p className="mb-1"><strong>Contact:</strong> {branch.contact.email} | {branch.contact.phoneNumber}</p>
                <div className="mt-2">
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEditClick(branch)}>Edit Branch</button>
                    <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleDelete(branch.id)}>Delete Branch</button>
                    {/* --- NEW BUTTON TO NAVIGATE TO THE DASHBOARD --- */}
                    <Link to={`/admin/bank-dashboard?branchId=${branch.id}`} className="btn btn-sm btn-primary">
                        Manage Users & Stats
                    </Link>
                </div>
            </div>
        ))}
    </div>
) : (
    <p>No branches have been created yet.</p>
)}
            </div>
            <Footer />
        </>
    );
};

export default BranchManagement;
