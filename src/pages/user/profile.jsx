import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import AppNavbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const API_BASE_URL = 'http://localhost:9001/api/user';

const KycProfile = () => {
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [validated, setValidated] = useState(false);

    const [formData, setFormData] = useState({
        username: '', email: '', mobileNo: '', dob: '',
        gender: '', aadharNo: '', panNo: '',
        address: { houseNo: '', village: '', mandal: '', district: '', state: '', pinCode: '' }
    });
    
    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("user"));
        
        if (!storedData || !storedData.user) {
            console.error("No user data found in localStorage, redirecting to login.");
            navigate("/login");
            return;
        }

        const userDetails = storedData.user;
        
        setFormData({
            username: userDetails.username || '',
            email: userDetails.email || '',
            mobileNo: userDetails.phoneNo || '',
            dob: userDetails.dob ? userDetails.dob.split('T')[0] : '', 
            gender: userDetails.gender || '',
            aadharNo: userDetails.aadharNo || '',
            panNo: userDetails.panNo || '',
            address: (userDetails.addresses && userDetails.addresses[0]) || { houseNo: '', village: '', mandal: '', district: '', state: '', pinCode: '' },
        });

        // Automatically enter edit mode if essential details are missing
        if (!userDetails.dob || !userDetails.gender || !userDetails.addresses || userDetails.addresses.length === 0) {
            setIsEditing(true);
        }

        setIsLoading(false);
    }, [navigate]);
    
    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwtToken");
        navigate("/login");
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        if (['houseNo', 'village', 'mandal', 'district', 'state', 'pinCode'].includes(id)) {
            setFormData(prev => ({ ...prev, address: { ...prev.address, [id]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setValidated(true);

        if (form.checkValidity() === false) {
            event.stopPropagation();
            return;
        }

        const storedData = JSON.parse(localStorage.getItem("user"));
        const token = storedData?.accessToken;
        if (!token) {
            alert("Authentication token not found. Please log in again.");
            return;
        }

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const detailsPayload = {
                dob: formData.dob,
                gender: formData.gender,
                addresses: [formData.address]
            };
            await axios.put(`${API_BASE_URL}/details`, detailsPayload, { headers });
            const kycPayload = {
                aadharNo: formData.aadharNo,
                panNo: formData.panNo
            };
            await axios.put(`${API_BASE_URL}/kyc`, kycPayload, { headers });
            const updatedUser = { ...storedData.user, ...formData };
            const newStoredData = { ...storedData, user: updatedUser };
            localStorage.setItem("user", JSON.stringify(newStoredData));

            alert('Profile updated successfully!');
            setIsEditing(false); 
            setValidated(false); 

        } catch (error) {
            console.error("Failed to update profile:", error.response?.data || error.message);
            alert('Failed to update profile. Please check the console for more details.');
        }
    };

    if (isLoading) {
        return <div className="text-center p-5">Loading Profile...</div>;
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <AppNavbar onLogout={handleLogout} />
            <div className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="mb-0">Manage Your Profile</h2>
                            {!isEditing && (
                                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            // --- EDITING MODE ---
                            <form onSubmit={handleSubmit} noValidate className={validated ? 'was-validated' : ''}>
                                <div className="card mb-4">
                                    <div className="card-header p-3 h5">Edit Your Details</div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6"><label className="form-label">Full Name</label><input type="text" className="form-control" value={formData.username} disabled /></div>
                                            <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" value={formData.email} disabled /></div>
                                            <div className="col-md-6"><label className="form-label">Mobile Number</label><input type="text" className="form-control" value={formData.mobileNo} disabled /></div>
                                            <div className="col-md-6"><label htmlFor="dob" className="form-label">Date of Birth</label><input type="date" className="form-control" id="dob" value={formData.dob} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="gender" className="form-label">Gender</label><select className="form-select" id="gender" value={formData.gender} onChange={handleChange} required><option value="" disabled>Choose...</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
                                            <div className="col-12"><hr /></div>
                                            <div className="col-md-6"><label htmlFor="aadharNo" className="form-label">Aadhar Number</label><input type="text" className="form-control" id="aadharNo" pattern="\d{12}" value={formData.aadharNo} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="panNo" className="form-label">PAN Number</label><input type="text" className="form-control" id="panNo" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" value={formData.panNo} onChange={handleChange} required /></div>
                                            <div className="col-12"><hr /></div>
                                            <div className="col-md-6"><label htmlFor="houseNo" className="form-label">House No</label><input type="text" className="form-control" id="houseNo" value={formData.address.houseNo} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="village" className="form-label">Village/Street</label><input type="text" className="form-control" id="village" value={formData.address.village} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="mandal" className="form-label">Mandal</label><input type="text" className="form-control" id="mandal" value={formData.address.mandal} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="district" className="form-label">District</label><input type="text" className="form-control" id="district" value={formData.address.district} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="state" className="form-label">State</label><input type="text" className="form-control" id="state" value={formData.address.state} onChange={handleChange} required /></div>
                                            <div className="col-md-6"><label htmlFor="pinCode" className="form-label">Pin Code</label><input type="text" className="form-control" id="pinCode" pattern="\d{6}" value={formData.address.pinCode} onChange={handleChange} required /></div>
                                        </div>
                                    </div>
                                    <div className="card-footer text-end">
                                        <button className="btn btn-secondary me-2" type="button" onClick={() => {setIsEditing(false); setValidated(false);}}>Cancel</button>
                                        <button className="btn btn-primary" type="submit">Save Changes</button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="card">
                                <div className="card-header p-3 h5">Your Information</div>
                                <div className="card-body">
                                    <dl className="row">
                                        <dt className="col-sm-3">Full Name</dt><dd className="col-sm-9">{formData.username}</dd>
                                        <dt className="col-sm-3">Email</dt><dd className="col-sm-9">{formData.email}</dd>
                                        <dt className="col-sm-3">Mobile</dt><dd className="col-sm-9">{formData.mobileNo}</dd>
                                        <dt className="col-sm-3">Date of Birth</dt><dd className="col-sm-9">{formData.dob || 'Not provided'}</dd>
                                        <dt className="col-sm-3">Gender</dt><dd className="col-sm-9 text-capitalize">{formData.gender ? formData.gender.toLowerCase() : 'Not provided'}</dd>
                                        <hr className="my-3"/>
                                        <dt className="col-sm-3">Aadhar No</dt><dd className="col-sm-9">{formData.aadharNo || 'Not provided'}</dd>
                                        <dt className="col-sm-3">PAN No</dt><dd className="col-sm-9">{formData.panNo || 'Not provided'}</dd>
                                        <hr className="my-3"/>
                                        <dt className="col-sm-3">Address</dt><dd className="col-sm-9">{formData.address.houseNo ? `${formData.address.houseNo}, ${formData.address.village}, ${formData.address.mandal}, ${formData.address.district}, ${formData.address.state} - ${formData.address.pinCode}` : 'Not provided'}</dd>
                                    </dl>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default KycProfile;
