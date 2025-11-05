import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import jsPDF from "jspdf";
import AppNavbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const brandColors = {
  navy: "#012169",
  red: "#E31837",
  accent: "#0ea5a4"
};

const services = [
  {
    heading: "TOTAL CONTROL",
    title: "Account Management",
    description: "Central dashboard to view balances, categorize spending, and download statements.",
    path: "/accounts",
    image:
      "https://www.shutterstock.com/image-photo/smiling-group-business-people-discussing-600nw-2412632005.jpg",
    icon: "🔒",
    badge: "Most used"
  },
  {
    heading: "SEAMLESS & SECURE",
    title: "Instant Payments",
    description: "Fast transfers, scheduled payments, and saved payees.",
    path: "/pay",
    image:
      "https://media.istockphoto.com/id/2078490118/photo/businessman-using-laptop-to-online-payment-banking-and-online-shopping-financial-transaction.jpg?s=612x612&w=0&k=20&c=1x2G24ANsWxG4YW6ZaoeFPEzjmKFE4ZlohVQSwbjGj8=",
    icon: "⚡",
    badge: "Fast"
  },
  {
    heading: "EXCLUSIVE REWARDS",
    title: "Card Services",
    description: "Control cards, set limits, and unlock tailored rewards.",
    path: "/services/cards",
    image:
      "https://media.assettype.com/deccanherald%2Fimport%2Fsites%2Fdh%2Ffiles%2Farticleimages%2F2023%2F06%2F13%2Fcredit-debit-cards-1220228-1684508294-1227486-1686675074.jpg?w=undefined&auto=format%2Ccompress&fit=max",
    icon: "💳",
    badge: "Rewards"
  },
  {
    heading: "YOUR GOALS, FUNDED",
    title: "Loans & EMI",
    description: "Personalized loan offers with transparent terms.",
    path: "/services/loans",
    image:
      "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=1200",
    icon: "🎯",
    badge: "Flexible"
  }
];

const heroSlides = [
  {
    title: "Banking that moves with you",
    subtitle: "Secure, fast and built for the digital lifestyle.",
    cta: "View Profile",
    ctaPath: "/profile/kyc",
    image:
      "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
  },
  {
    title: "Payments without the wait",
    subtitle: "Send and receive instantly — with complete peace of mind.",
    cta: "Make a Transfer",
    ctaPath: "/pay",
    image:
      "https://images.pexels.com/photos/4386465/pexels-photo-4386465.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
  },
  {
    title: "Cards, rewards & protection",
    subtitle: "Cards designed for spending and savings that actually work for you.",
    cta: "Explore Cards",
    ctaPath: "/services/cards",
    image:
      "https://images.pexels.com/photos/4386437/pexels-photo-4386437.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
  }
];

const stories = [
  {
    name: "Ananya R.",
    role: "Small Business Owner",
    quote: "NeoBank automated payroll and reporting — saved me hours every week.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    servicePath: "/accounts"
  },
  {
    name: "Rahul K.",
    role: "Freelancer",
    quote: "Fast transfers and clean statements — my clients love it.",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    servicePath: "/pay"
  },
  {
    name: "Priya S.",
    role: "Product Manager",
    quote: "Loan application was transparent and approval was quick.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    servicePath: "/services/loans"
  }
];

const faqs = [
  {
    q: "How do I download my statements?",
    a: "Go to Accounts → Statements and pick the period. You can download PDF or CSV instantly."
  },
  {
    q: "Is my data secure?",
    a: "Yes — we use bank-level encryption and strict security controls."
  },
  {
    q: "Can I schedule recurring payments?",
    a: "Yes — use the Payments page and select 'Schedule' for recurring transfers."
  }
];

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeHero, setActiveHero] = useState(0);
  const heroTimerRef = useRef(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonialTimerRef = useRef(null);
  const [txCount, setTxCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

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
    setIsLoading(false);
    animateCountUp(setTxCount, tx.length || 0, 900);
    animateCountUp(setUserCount, 180000, 1400);
    animateCountUp(setUptime, 98, 1100);
    startHeroAuto();
    startTestimonialAuto();
    return () => {
      stopHeroAuto();
      stopTestimonialAuto();
    };
  }, [navigate]);

  const startHeroAuto = () => {
    stopHeroAuto();
    heroTimerRef.current = setInterval(() => {
      setActiveHero((h) => (h + 1) % heroSlides.length);
    }, 5000);
  };
  const stopHeroAuto = () => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current);
  };
  const startTestimonialAuto = () => {
    stopTestimonialAuto();
    testimonialTimerRef.current = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % stories.length);
    }, 6000);
  };
  const stopTestimonialAuto = () => {
    if (testimonialTimerRef.current) clearInterval(testimonialTimerRef.current);
  };
  const animateCountUp = (setter, target, duration = 1000) => {
    if (target <= 0) {
      setter(0);
      return;
    }
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(
        start + (target - start) * (1 - Math.pow(1 - progress, 3))
      );
      setter(value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("NeoBank — Transactions", 14, 22);
    doc.setFontSize(10);
    const rows = (transactions || [])
      .slice(0, 30)
      .map((tx) => [
        tx.date || "-",
        tx.description || tx.type || "-",
        tx.amount?.toString() || "-",
        tx.balance?.toString() || "-"
      ]);
    let y = 30;
    rows.forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(row.join("  |  "), 14, y);
      y += 6;
    });
    doc.save("neobank_transactions.pdf");
  };

  if (isLoading)
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        Loading...
      </div>
    );

  return (
    <>
      <style>{`
        .fade-in {
          animation: fadeIn 600ms ease both;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-wrap {
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          min-height: 340px;
          box-shadow: 0 18px 50px rgba(2,6,23,0.12);
        }
        .hero-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transform: scale(1.03);
          transition: opacity 650ms ease, transform 650ms ease;
        }
        .hero-slide.show {
          opacity: 1;
          transform: scale(1);
        }
        .hero-glass {
          position: absolute;
          right: 40px;
          top: 50%;
          transform: translateY(-50%);
          width: 46%;
          background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          backdrop-filter: blur(8px) saturate(120%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 28px;
          color: white;
        }
        .service-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          border-radius: 12px;
          display: flex;
          min-height: 140px;
          border: 1px solid rgba(2,6,23,0.04);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(2,6,23,0.06);
        }
        .service-media {
          width: 40%;
          min-width: 150px;
          object-fit: cover;
        }
        .service-body {
          padding: 18px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .ai-bubble {
          position: fixed;
          right: 20px;
          bottom: 24px;
          width: 68px;
          height: 68px;
          background: linear-gradient(135deg, ${brandColors.red}, ${brandColors.navy});
          border-radius: 999px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 18px 40px rgba(3, 12, 60, 0.18);
          cursor: pointer;
          z-index: 1200;
        }
        .ai-popup {
          position: fixed;
          right: 96px;
          bottom: 20px;
          width: 320px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 30px 60px rgba(2, 6, 23, 0.12);
          z-index: 1200;
        }
      `}</style>

      <div style={{ backgroundColor: "#fbfcfe", minHeight: "100vh" }}>
        <AppNavbar onLogout={logout} />

        <div className="container py-5">
          {/* HERO */}
          <div className="hero-wrap mb-5 fade-in">
            {heroSlides.map((s, i) => (
              <div
                key={i}
                className={`hero-slide ${i === activeHero ? "show" : ""}`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.10)), url(${s.image})`
                }}
              />
            ))}

            <div className="hero-glass">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "1.9rem", fontWeight: "700" }}>
                    {heroSlides[activeHero].title}
                  </div>
                  <div style={{ fontSize: "1rem", marginBottom: 14 }}>
                    {heroSlides[activeHero].subtitle}
                  </div>
                  <button
                    className="btn btn-light"
                    onClick={() => navigate(heroSlides[activeHero].ctaPath)}
                    style={{ marginRight: 8 }}
                  >
                    {heroSlides[activeHero].cta}
                  </button>
                  <button
                    className="btn btn-outline-light"
                    onClick={() => navigate("/services")}
                  >
                    Explore Services
                  </button>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div>Hello</div>
                  <div style={{ fontWeight: 700 }}>{user.username}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHero(idx)}
                    style={{
                      width: idx === activeHero ? 28 : 10,
                      height: 10,
                      borderRadius: 999,
                      border: "none",
                      background:
                        idx === activeHero
                          ? brandColors.red
                          : "rgba(255,255,255,0.22)"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* COUNTERS */}
          <div className="row mb-4 align-items-center">
            <div className="col-lg-6 mb-3">
              <h2 style={{ color: brandColors.navy, fontWeight: 700 }}>
                Welcome,{" "}
                <span style={{ color: brandColors.red }}>{user.username}</span>
              </h2>
              <p>Your secure digital banking hub.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/accounts")}
                style={{
                  background: brandColors.navy,
                  borderColor: brandColors.navy,
                  marginRight: 10
                }}
              >
                Accounts
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/pay")}
              >
                Payments
              </button>
            </div>

            <div className="col-lg-6 text-lg-end">
              <div className="d-flex justify-content-lg-end gap-3 flex-wrap">
                <div className="counter-card">
                  <div>Transactions</div>
                  <div className="counter-num">{txCount.toLocaleString()}</div>
                </div>
                <div className="counter-card">
                  <div>Users</div>
                  <div className="counter-num">{userCount.toLocaleString()}</div>
                </div>
                <div className="counter-card">
                  <div>Uptime</div>
                  <div className="counter-num">{uptime}%</div>
                </div>
              </div>
            </div>
          </div>

          
<div
  className="services-grid mb-5 fade-in"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  }}
>
  {services.map((s) => (
    <div className="service-card" key={s.title} style={{ cursor: "pointer" }}>
      <img className="service-media" src={s.image} alt={s.title} />
      <div className="service-body">
        <div>
          {/* <div style={{ color: brandColors.red, fontSize: 12 }}>{s.heading}</div> */}
          <div
            style={{
              fontWeight: 700,
              color: brandColors.navy,
              marginTop: 6,
            }}
          >
            {s.title}
          </div>
          <p style={{ fontSize: 14, color: "#475569" }}>{s.description}</p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Link
            to={s.path}
            className="btn btn-sm btn-primary"
            style={{
              background: brandColors.navy,
              borderColor: brandColors.navy,
            }}
          >
            Open
          </Link>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{s.badge}</div>
        </div>
      </div>
    </div>
  ))}
</div>
<div
  style={{
    position: "relative",
    width: "100%",
    height: "300px", // adjust height as needed
    overflow: "hidden",
    marginBottom: "2rem",
  }}
>
  {/* Background Image */}
  <img
    src="https://www.shutterstock.com/image-photo/smiling-group-business-people-discussing-600nw-2412632005.jpg"
    alt="Powerful Quote Background"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      filter: "brightness(0.6)", // darken image for better text contrast
      zIndex: 1,
    }}
  />

  {/* White overlay container */}
  <div
    style={{
      position: "relative",
      zIndex: 2,
      backgroundColor: "white",
      maxWidth: "600px",
      padding: "2rem",
      // borderRadius: "12px",
      marginLeft: "2rem",
      marginTop: "4rem",
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    }}
  >
    <blockquote
      style={{
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "#012169", // brand navy color
        margin: 0,
      }}
    >
      "Empowering your financial future with every transaction."
    </blockquote>
  </div>
</div>


          {/* TESTIMONIALS */}
          <div className="row mb-5">
            <div className="col-lg-8">
              <h4 style={{ color: brandColors.navy }}>What our customers say</h4>
              <div style={{ marginTop: 12 }}>
                {stories.map((st, idx) => (
                  <div
                    key={st.name}
                    style={{
                      display: idx === testimonialIndex ? "block" : "none",
                      background: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: "0 12px 28px rgba(10,18,40,0.05)"
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <img
                        src={st.image}
                        alt={st.name}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{st.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>
                          {st.role}
                        </div>
                      </div>
                    </div>
                    <p style={{ marginTop: 10 }}>"{st.quote}"</p>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(st.servicePath)}
                    >
                      View related service
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() =>
                    setTestimonialIndex(
                      (i) => (i - 1 + stories.length) % stories.length
                    )
                  }
                >
                  Prev
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() =>
                    setTestimonialIndex((i) => (i + 1) % stories.length)
                  }
                  style={{ marginLeft: 6 }}
                >
                  Next
                </button>
              </div>
            </div>

            {/* FAQ */}
            <div className="col-lg-4">
              <h4 style={{ color: brandColors.navy }}>Help & FAQs</h4>
              <div style={{ marginTop: 12 }}>
                {faqs.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid rgba(2,6,23,0.05)",
                      borderRadius: 10,
                      marginBottom: 10
                    }}
                  >
                    <div
                      style={{
                        padding: 12,
                        cursor: "pointer",
                        background: "#f9fafb"
                      }}
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    >
                      <strong>{f.q}</strong>
                    </div>
                    {openFaq === idx && (
                      <div style={{ padding: 12, background: "white" }}>
                        {f.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MISSION & ABOUT */}
          <section
  className="mb-5 p-4 rounded"
  style={{
    position: "relative",
    backgroundImage: "url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    width: "100vw",
    left: "50%",
    right: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
  }}
>
  <div
    className="text-center"
    style={{
      backgroundColor: "rgba(255,255,255,0.85)",
      maxWidth: 900,
      margin: "0 auto",
      padding: "2rem",
      borderRadius: "8px",
    }}
  >
    <h2 style={{ color: brandColors.red, letterSpacing: "1.6px" }}>
      Our Mission
    </h2>
    <p style={{ color: brandColors.navy }}>
      {user?.bankMission || "To empower clients through technology and transparent banking."}
    </p>
  </div>
</section>

        </div>

        <Footer />

        {/* AI Bubble */}
        <div
          className="ai-bubble"
          onClick={() => {
            const existing = document.getElementById("ai-popup");
            if (existing) existing.remove();
            else {
              const container = document.createElement("div");
              container.id = "ai-popup";
              container.className = "ai-popup fade-in";
              container.innerHTML = `
                <div style="padding:14px">
                  <strong>NeoBot</strong>
                  <p style="margin-top:8px">Hello 👋 Ask me anything about your dashboard!</p>
                  <button id="ai-close-btn" class="btn btn-sm btn-primary">Close</button>
                </div>`;
              document.body.appendChild(container);
              document.getElementById("ai-close-btn").onclick = () =>
                container.remove();
            }
          }}
        >
          🤖
        </div>
      </div>
    </>
  );
}

export default Dashboard;
