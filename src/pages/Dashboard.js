import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, equalTo, query, orderByChild } from "firebase/database";
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
            }
          }
        });

        const taxRef = ref(db, "taxData/" + userId);
        onValue(taxRef, (snapshot) => {
          setTaxData(snapshot.val() || {});
        });

        const incomeRef = ref(db, "incomeEntries/" + userId);
        onValue(incomeRef, (snapshot) => {
          setIncomeData(snapshot.val() || []);
        });

        const fetchdata = async () => {
          try {
            const expenseRef = ref(db, "expenseCollection");
            const q = query(
              expenseRef,
              orderByChild("employer"),
              equalTo(userId)
            );
            let data = {};

            onValue(q, (snapshot) => {
              data = snapshot.val();
            });

            if (!data) {
              return []; // Return an empty array if there's no data
            }

            const expenseArray = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...value,
            }));

            setExpenseData(
              expenseArray.filter((expense) => expense.accepted === undefined)
            );
          } catch (error) {
            console.error("Error fetching expenses:", error);
          }
        };

        fetchdata();
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

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="dashboard-container">
      <div>
        <h1>Welcome, {firstname}!</h1>
        <p>Your role: {userRole}</p>
        {userRole === "Employer" && <p>Your Business: {businessName}</p>}
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

