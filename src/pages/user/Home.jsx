import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import jsPDF from "jspdf";
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// --- DESIGN TOKENS ---
const brandColors = {
  navy: '#012169',
  red: '#E31837'
};

// --- Service Definitions with Images ---
const services = [
  {
    heading: "TOTAL CONTROL",
    title: "Account Management",
    description: "Your central hub to view balances, track spending, and download detailed statements. Stay in complete control of your primary financial accounts with our intuitive interface, designed for clarity and ease of use.",
    path: "/accounts",
    image: "https://t3.ftcdn.net/jpg/03/10/46/56/360_F_310465670_Wy4QCEfxYU2ziHjbeZsNAumKhaZzZS1w.jpg"
  },
  {
    heading: "SEAMLESS & SECURE",
    title: "Instant Payments",
    description: "Send money, pay bills, and manage transfers effortlessly. Our secure, state-of-the-art payment gateway ensures your funds move safely and swiftly, giving you peace of mind with every transaction.",
    path: "/pay",
    image: "https://www.techfunnel.com/wp-content/uploads/2024/05/Digital-Payment-Trends-scaled.jpg"
  },
  {
    heading: "EXCLUSIVE REWARDS",
    title: "Card Services",
    description: "Manage your debit and credit cards, from setting spending limits to applying for new ones. Unlock a world of exclusive rewards, benefits, and unparalleled security features tailored to your lifestyle.",
    path: "/services/cards",
    image: "https://www.pickmywork.com/wp-content/uploads/2022/07/credit-card-banner.jpeg"
  },
  {
    heading: "YOUR GOALS, FUNDED",
    title: "Loan Products",
    description: "Explore flexible loan options designed to help you achieve your dreams. Whether it's for a new home, a car, or a personal project, we offer competitive rates and simple terms to support your ambitions.",
    path: "/services/loans",
    image: "https://bsmedia.business-standard.com/_media/bs/img/article/2017-03/01/full/1488322800-0994.jpg?im=FeatureCrop,size=(826,465)"
  }
];

// --- About Bank Content ---
const aboutBank = {
    mission: "To empower our clients by simplifying their financial lives through innovative technology and personalized, transparent banking solutions.",
    about: "NeoBank is not just a bank; it's a financial partner for the digital age. Founded on the principles of innovation and integrity, we leverage cutting-edge technology to deliver a banking experience that is both powerful and intuitive. We are committed to demystifying finance and providing our customers with the tools they need to thrive in an ever-changing economic landscape."
};

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [notif, setNotif] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("user"));
    if (!storedData || !storedData.user) {
      navigate("/login");
      return;
    }
    const userDetails = storedData.user;
    setUser(userDetails);
    const tx = JSON.parse(localStorage.getItem("transactions_" + userDetails.email) || "[]");
    setTransactions(tx);
    setNotif(JSON.parse(localStorage.getItem("notifications_" + userDetails.email) || "[]"));
    setIsLoading(false);
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const downloadPDF = () => {
    // PDF generation logic remains the same
  };

  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>;
  }

  return (
    <>
      {/* --- CSS for Hover Effects & Animations --- */}
      <style>{`
        .service-image-container {
          overflow: hidden;
          border-radius: 0.5rem;
          transition: box-shadow 0.3s ease-in-out;
        }
        .service-image {
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          cursor: pointer;
        }
        .service-image-container:hover {
          box-shadow: 0 10px 30px rgba(227, 24, 55, 0.4);
        }
        .service-image-container:hover .service-image {
          transform: scale(1.05);
        }
        .btn-explore:hover {
          background-color: ${brandColors.red} !important;
          border-color: ${brandColors.red} !important;
          color: white !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .btn-explore {
            transition: all 0.3s ease;
        }
      `}</style>
    
      <div style={{ backgroundColor: '#fff' }}>
        <AppNavbar onLogout={logout} />
        
        <div className="container py-5">
          {/* --- Welcome Banner --- */}
          <section className="row align-items-center mb-5">
            <div className="col-lg-12 text-center text-lg-start mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold" style={{ color: brandColors.navy }}>
                Welcome, <span style={{ color: brandColors.red }}>{user.username}</span>
              </h1>
              <p className="lead text-muted">
                Your personal command center for a secure and seamless banking experience.
              </p>
              <button 
                className="btn btn-primary mt-3 btn-explore"
                style={{ backgroundColor: brandColors.navy, borderColor: brandColors.navy }}
                onClick={() => navigate("/profile/kyc")}
              >
                View Your Profile
              </button>
            </div>
          </section>

          {/* --- Services Sections --- */}
          {/* --- Services Sections --- */}
{services.map((service, index) => (
  // CHANGE: Added .align-items-stretch to make columns equal height
  <section key={service.title} className="row g-0 align-items-stretch mb-5 pb-4">
    <div className={`col-md-6 ${index % 2 !== 0 ? 'order-md-2' : ''}`}>
      {/* CHANGE: Added h-100 to the container */}
      <div className="service-image-container rounded shadow-lg h-100" onClick={() => navigate(service.path)}>
          <img 
            src={service.image} 
            alt={service.title} 
            // CHANGE: Added inline style for object-fit
            className="service-image" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
      </div>
    </div>
    <div className={`col-md-6 p-4 p-lg-5 ${index % 2 !== 0 ? 'order-md-1' : ''}`}>
      <h3 className="text-uppercase fw-bold" style={{ color: brandColors.red, letterSpacing: '2px' }}>
        {service.heading}
      </h3>
      <h2 className="display-5 fw-bold my-3" style={{ color: brandColors.navy }}>
        {service.title}
      </h2>
      <p className="fs-5" style={{ color: '#343a40' }}>
        {service.description}
      </p>
      <Link to={service.path} className="btn btn-primary mt-3 btn-explore" style={{ backgroundColor: brandColors.navy, borderColor: brandColors.navy }}>
        Explore {service.title} &rarr;
      </Link>
    </div>
  </section>
))}

          
          {/* --- Mission & About Section --- */}
          <section className="mb-5 p-4 rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="text-center">
              <h2 className="text-uppercase fw-bold" style={{ color: brandColors.red, letterSpacing: '2px' }}>Our Mission</h2>
              <p className="fs-5 fst-italic" style={{ color: brandColors.navy, maxWidth: '800px', margin: '0 auto 2rem auto' }}>
                "{aboutBank.mission}"
              </p>
              <h3 className="fw-bold" style={{ color: brandColors.navy }}>About NeoBank</h3>
              <p className="fs-6" style={{ color: '#343a40', maxWidth: '800px', margin: '0 auto' }}>
                {aboutBank.about}
              </p>
            </div>
          </section>
        </div>
        
        <Footer />
      </div>
    </>
  );
}

export default Dashboard;
