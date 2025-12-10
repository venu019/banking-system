import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
 
const brand = {
  navy: "#011A4B",
  red: "#E31837",
  gray: "#f5f7fb",
  gradient: "linear-gradient(135deg, #011A4B, #002d7a, #011A4B)",
};
const brandColors = {
  navy: "#012169",
  red: "#E31837",
  accent: "#0ea5a4"
};
 
const PreLoginHome = () => {
  const navigate = useNavigate();
 
  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 100 });
  }, []);
 
  const testimonials = [
    {
      name: "Rahul Verma",
      role: "Entrepreneur",
      quote:
        "NeoBank transformed my business operations. The AI expense tracking and instant transfers are unmatched.",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Freelancer",
      quote:
        "The onboarding was seamless — 5 minutes, and I was live. NeoBank redefines modern banking.",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      rating: 5,
    },
    {
      name: "Amit Patel",
      role: "Engineer",
      quote:
        "Their security and design make me feel safe. NeoBank feels like the Apple of Indian banking.",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      rating: 4,
    },
  ];
 
  const cards = [
    {
      name: "Neo Platinum Credit Card",
      desc: "Luxury meets convenience — 6% cashback, global access, and priority privileges.",
      img: "https://www.visa.co.in/dam/VCOM/regional/ap/india/global-elements/images/in-visa-platinum-card-498x280.png",
    },
    {
      name: "Neo Debit Card",
      desc: "Your money, your control. Instant payments and advanced protection.",
      img: "https://strapi-cdn.indmoney.com/xlarge_Block_a_Debit_or_Credit_Card_1_c267187c06.jpg",
    },
    {
      name: "Neo Rewards Card",
      desc: "Earn limitless rewards for every purchase — no expiry, no limits.",
      img: "https://www.elanfinancialservices.com/content/dam/elanfinancialservices/images/prepaidsolution/reward_card_trans.png",
    },
  ];
 
  const milestones = [
    {
      year: "2025",
      title: "Founded",
      desc: "NeoBank was born to redefine how India banks — 100% digital, secure, and transparent.",
      img: "https://media.istockphoto.com/id/1349030917/photo/business-and-finance-looking-up-at-high-rise-office-buildings-in-the-financial-district-of-a.jpg?s=612x612&w=0&k=20&c=NSnN0va-f1OBG_GA7bTVmUIoBwNDKUXtHD8_PzeTNiA=",
      icon: "bi-rocket-takeoff-fill"
    },
    {
      year: "2026",
      title: "Nationwide Expansion",
      desc: "Reached 100+ cities and 1 million customers with world-class financial accessibility.",
      img: "https://media.istockphoto.com/id/1947499362/photo/happy-group-of-business-people-discussing-strategy-during-team-meeting-at-the-office-desk.jpg?s=612x612&w=0&k=20&c=UXPrlQx09d8EP4_kTdAa-vC2LxD_ppY1tiG7eTPGVbE=",
      icon: "bi-globe-americas"
    },
    {
      year: "2027",
      title: "AI-Driven Banking",
      desc: "Introduced India's first AI financial advisor — smart, predictive, and personalized.",
      img: "https://thumbs.dreamstime.com/b/laptop-data-analytics-dashboard-screen-modern-office-setting-345532033.jpg",
      icon: "bi-cpu-fill"
    },
    {
      year: "2028",
      title: "International Recognition",
      desc: "Awarded Best Fintech of Asia by the Global Financial Innovation Forum.",
      img: "https://media.istockphoto.com/id/471296532/photo/planet-earth-at-night.jpg?s=612x612&w=0&k=20&c=n-9GMF-nYTuZJ5z6oc7sCo8MagfPlx2JeK-4visym_E=",
      icon: "bi-trophy-fill"
    },
  ];
 
 
  const awards = [
    {
      icon: "bi-trophy-fill",
      title: "Best Fintech Innovation 2027",
      org: "RBI FinTech Awards",
    },
    {
      icon: "bi-shield-check",
      title: "Top Security Compliance",
      org: "ISO/IEC 27001 Certified",
    },
    {
      icon: "bi-globe",
      title: "Most Inclusive Bank 2028",
      org: "Digital India Excellence Forum",
    },
  ];
 
  const partners = [
    "https://upload.wikimedia.org/wikipedia/commons/5/51/Business_Insider_Logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5a/Forbes_logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3e/The_Economic_Times_logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f3/Reuters_Logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9a/CNBC_logo.svg",
  ];
 
  return (
    <div style={{ backgroundColor: brand.gray, overflowX: "hidden" }}>
      <section
  className="hero-wrap text-white position-relative d-flex align-items-center justify-content-center"
  style={{
    minHeight: "100vh",
    backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.10)), url('https://latinia.com/wp-content/uploads/The-role-of-responsible-banking-as-a-driver-of-sustainability.png')`, // Replace with your actual image path
    backgroundSize: "cover",
    backgroundPosition: "center",
    overflow: "hidden",
  }}
>
  <div
    className="hero-glass"
    style={{
      position: "absolute",
      left: "40px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "46%",
      background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
      backdropFilter: "blur(8px) saturate(120%)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      padding: "28px",
      color: "white",
      zIndex: 2,
    }}
  >
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "12px" }}>
        Welcome to <span style={{ color: brandColors.red }}>NeoBank</span>
      </h1>
      <p style={{ fontSize: "1rem", marginBottom: "20px", opacity: 0.85 }}>
        India’s next-generation digital bank — secure, intelligent, and designed for you.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          className="btn btn-light"
          onClick={() => navigate("/register")}
        >
          Register now
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>
    </div>
  </div>
</section>

<section className="py-5" style={{ backgroundColor: brand.gray }} id="services">
        <div className="container text-center">
          <h2 className="fw-bold mb-5" style={{ color: brand.navy }}>
            Core Banking Features
          </h2>
          <div className="row row-cols-1 row-cols-md-4 g-4">
            {[
              { icon: "bi-lightning-charge", title: "Instant Payments", desc: "Lightning-fast domestic and international transfers." },
              { icon: "bi-shield-lock", title: "Secure by Design", desc: "Military-grade encryption and real-time fraud alerts." },
              { icon: "bi-piggy-bank", title: "Smart Savings", desc: "Auto-save goals with AI insights to grow faster." },
              { icon: "bi-bar-chart-line", title: "Expense Analytics", desc: "Track and understand your spending patterns easily." },
            ].map((f, i) => (
              <motion.div
                className="col"
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                whileHover={{ scale: 1.05 }}
              >
                <div className="p-4 bg-white rounded-4 shadow-sm h-100">
                  <i className={`${f.icon} text-danger display-6 mb-3`}></i>
                  <h6 className="fw-bold">{f.title}</h6>
                  <p className="text-muted small">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ABOUT SECTION */}
<section className="py-5 position-relative" id="about" style={{ minHeight: '500px' }}>
  {/* Background Image */}
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'url(https://media.istockphoto.com/id/1351571961/photo/looking-directly-up-at-the-skyline-of-the-financial-district-in-central-london.jpg?s=612x612&w=0&k=20&c=4J_aWJc5gMATCtIbMkF0dMq4dzz_XjLx5DpwnuPJwkg=)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      zIndex: 0,
    }}
  ></div>
 
  {/* Content Island */}
  <div className="container" style={{ position: 'relative', zIndex: 2 }}>
    <div className="row justify-content-left">
      <div className="col-lg-8" data-aos="fade-up">
        <div
          className="bg-white p-5 shadow-lg"
          style={{
            borderRadius: '0px',
            backdropFilter: 'blur(10px)',
            marginTop: '60px',
          }}
        >
          <h2 className="fw-bold mb-3" style={{ color: brand.navy }}>
            Banking Reinvented for India
          </h2>
          <p className="text-muted mb-4">
            Established in 2025, NeoBank is India's most progressive digital
            bank — combining technology, design, and transparency to deliver
            financial empowerment for all.
          </p>
          <ul className="list-unstyled text-muted">
            <li className="mb-2">✅ 24/7 Banking Access</li>
            <li className="mb-2">✅ AI-Powered Fraud Protection</li>
            <li>✅ RBI Certified • ISO Secured • Cloud-Native Infrastructure</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>
 
 
      
       <section className="py-5 bg-white text-center" id="cards">
        <div className="container">
          <h2 className="fw-bold mb-4" style={{ color: brand.navy }}>
            Explore NeoBank Cards
          </h2>
          <p className="text-muted mx-auto mb-5" style={{ maxWidth: "700px" }}>
            From cashback to business control — explore cards tailored for every
            lifestyle and profession.
          </p>
          <div className="row g-4 justify-content-center">
            {cards.map((c, i) => (
              <motion.div
                key={i}
                className="col-md-3"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                data-aos="fade-up"
                data-aos-delay={i * 150}
              >
                <div className="card border-0 shadow-sm overflow-hidden h-100">
                  <div
                    style={{
                      height: "190px",
                      backgroundImage: `url(${c.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <div className="card-body text-start">
                    <h6 className="fw-bold text-danger mb-2">{c.name}</h6>
                    <p className="text-muted small">{c.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MILESTONES SECTION - V2 DESIGN (Floating White Boxes) */}
      <section className="py-5 position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)" }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-2" style={{ color: brand.navy }}>
            Our Journey
          </h2>
          <p className="text-muted mb-5">Milestones that shaped our success</p>
 
          <div className="row g-4">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                className="col-md-6 col-lg-3"
                data-aos="fade-up"
                data-aos-delay={i * 100}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  style={{
                    position: "relative",
                    height: "450px",
                    borderRadius: "0px",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                    cursor: "pointer",
                  }}
                  className="milestone-card-v2"
                >
                  {/* Background Image */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundImage: `url(${m.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transition: "transform 0.4s ease",
                    }}
                    className="milestone-bg-v2"
                  ></div>
 
                  {/* Lighter Gradient Overlay - More visible image */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.2) 85%, rgba(0, 0, 0, 0.4) 100%)",
                      zIndex: 1,
                    }}
                  ></div>
 
                  {/* Floating Content Box with Margins */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1.5rem",
                      left: "1.5rem",
                      right: "1.5rem",
                      background: "white",
                      padding: "1.75rem 1.5rem",
                      borderRadius: "0px",
                      zIndex: 2,
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                      transition: "all 0.4s ease",
                    }}
                    className="milestone-content-v2"
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: 700,
                          color: brand.red,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {m.year}
                        <div
                          style={{
                            width: "50px",
                            height: "3px",
                            background: brand.red,
                            marginTop: "5px",
                            marginLeft: "80px",
                          }}
                        ></div>
                      </div>
                      <h6 className="fw-semibold mb-2" style={{ color: brand.navy }}>
                        {m.title}
                      </h6>
                      <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                        {m.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
 
        {/* CSS for hover effects */}
        <style jsx="true">{`
          .milestone-bg-v2 {
            transition: transform 0.4s ease;
          }
          .milestone-card-v2:hover .milestone-bg-v2 {
            transform: scale(1.1);
          }
          .milestone-card-v2:hover .milestone-content-v2 {
            transform: translateY(-8px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </section>
 
 
      
 
      <section className="py-5 text-center text-white" style={{ background: brand.gradient }}>
        <div className="container">
          <h2 className="fw-bold mb-4">Awards & Recognition</h2>
          <div className="row g-4 justify-content-center">
            {awards.map((a, i) => (
              <div className="col-md-4" key={i} data-aos="fade-up" data-aos-delay={i * 150}>
                <div className="p-4 bg-white text-dark rounded-4 shadow-sm h-100">
                  <i className={`${a.icon} text-danger display-6 mb-3`}></i>
                  <h6 className="fw-bold mb-1">{a.title}</h6>
                  <p className="small text-muted">{a.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      <section className="py-5 bg-white" id="testimonials">
        <div className="container text-center">
          <h2 className="fw-bold mb-5" style={{ color: brand.navy }}>
            Customer Stories
          </h2>
          <div className="row g-4 justify-content-center">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="col-md-4"
                data-aos="fade-up"
                data-aos-delay={i * 150}
              >
                <div className="p-4 bg-light rounded-4 shadow-sm h-100 text-start">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="rounded-circle me-3"
                      style={{ width: 55, height: 55, objectFit: "cover" }}
                    />
                    <div>
                      <h6 className="fw-bold mb-0">{t.name}</h6>
                      <small className="text-muted">{t.role}</small>
                    </div>
                  </div>
                  <p className="text-muted small mb-2">“{t.quote}”</p>
                  <div className="text-warning">
                    {"★".repeat(t.rating)}
                    {"☆".repeat(5 - t.rating)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
 
      <section className="py-5 bg-white text-center" id="contact">
        <div className="container">
          <h2 className="fw-bold mb-4" style={{ color: brand.navy }}>
            Our Headquarters
          </h2>
          <p className="text-muted mb-5">
            Visit us at our innovation center — where digital banking meets
            creativity.
          </p>
          <div className="ratio ratio-16x9 rounded-4 shadow" data-aos="fade-up">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.8884382603183!2d77.59505087413559!3d12.978829887333263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae16726c3b90d7%3A0x96b401dcd1acb5b5!2sBangalore%20Tech%20Hub!5e0!3m2!1sen!2sin!4v1699352802333!5m2!1sen!2sin"
              title="NeoBank HQ"
              allowFullScreen
              loading="lazy"
              style={{ border: 0, borderRadius: "16px" }}
            ></iframe>
          </div>
        </div>
      </section>
 
      <footer className="text-center py-5 bg-dark text-white">
        <div className="container">
          <h6 className="fw-bold mb-2">
            NeoBank — Shaping the Future of Digital Finance
          </h6>
          <p className="small mb-3">
            © {new Date().getFullYear()} NeoBank | Secure • Transparent •
            Innovative
          </p>
          <div className="d-flex justify-content-center gap-3 mb-3">
            <a href="#" className="text-white-50">
              Privacy Policy
            </a>
            <a href="#" className="text-white-50">
              Terms of Service
            </a>
            <a href="#" className="text-white-50">
              Careers
            </a>
            <a href="#" className="text-white-50">
              Contact
            </a>
          </div>
          <div className="mb-3">
            <i className="bi bi-facebook mx-2"></i>
            <i className="bi bi-twitter mx-2"></i>
            <i className="bi bi-linkedin mx-2"></i>
            <i className="bi bi-instagram mx-2"></i>
          </div>
          <p className="text-white-50 small mb-0">
            Powered by NeoTech Digital Labs | Built by Jilan
          </p>
        </div>
      </footer>
    </div>
  );
};
 
export default PreLoginHome;
 