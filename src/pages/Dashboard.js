import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import "./Dashboard.css";
import { EmployerWidgets } from "../components/RoleWidgets/Employer/EmployerWidgets";
import { FreelancerWidgets } from "../components/RoleWidgets/Freelancer/FreelancerWidgets";

const Dashboard = () => {
  const [firstname, setFirstname] = useState("User");
  const [taxData, setTaxData] = useState({});
  const [businessName, setBusinessName] = useState("");
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [employerNames, setEmployerNames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      if (user) {
        const userId = user.uid;

        const userRef = ref(db, "users/" + userId);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUserRole(userData.role || "No role assigned");
            setFirstname(userData.firstname || "User");
            if (userData.role === "Employer") {
              setBusinessName(
                userData.businessName || "Business Name Not Available"
              );
            } else if (userData.role === "Freelancer") {
              // Fetch all linked employer names for the freelancer
              const linkedEmployers = userData.linkedEmployers || {};
              const employerIds = Object.keys(linkedEmployers);

              if (employerIds.length > 0) {
                const employerNamesTemp = [];
                employerIds.forEach((id) => {
                  const employerRef = ref(db, `users/${id}`);
                  onValue(employerRef, (empSnapshot) => {
                    const employerData = empSnapshot.val();
                    if (employerData && employerData.businessName) {
                      employerNamesTemp.push(employerData.businessName);
                      setEmployerNames(employerNamesTemp); // Update state with collected employer names
                    }
                  });
                });
              }
            }
          }
        });

        // Fetch tax data and income data
        const taxRef = ref(db, "taxData/" + userId);
        onValue(taxRef, (snapshot) => {
          setTaxData(snapshot.val() || {});
        });

        const incomeRef = ref(db, "incomeEntries/" + userId);
        onValue(incomeRef, (snapshot) => {
          setIncomeData(snapshot.val() || []);
        });

        setLoading(false);
      } else {
        // User is signed out
        setUserRole("");
        setTaxData({});
        setIncomeData([]);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Clean up subscription
  }, []);

  // Set interval for carousel scrolling
  useEffect(() => {
    if (userRole === "Freelancer" && employerNames.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % employerNames.length);
      }, 3000); // Change every 3 seconds

      return () => clearInterval(interval);
    }
  }, [userRole, employerNames]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Welcome, {firstname}!</h1>
        {/* Styled role display */}
        <div className={`role-tag ${userRole.toLowerCase()}`}>
          {userRole}{" "}
          {userRole === "Employer" ? (
            `at ${businessName}`
          ) : (
            employerNames.length > 0 && (
              <span className="carousel-scroll">
                for {employerNames[currentIndex]}
              </span>
            )
          )}
        </div>
      </div>
  
      <div className="dashboard-widgets">
        {userRole === "Freelancer" ? (
          <FreelancerWidgets taxData={taxData} incomeData={incomeData} />
        ) : (
          <EmployerWidgets expenseData={expenseData} />
        )}
      </div>
    </div>
  );
  
};

export default Dashboard;
