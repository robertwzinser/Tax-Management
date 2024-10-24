import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged
} from "firebase/auth";
import { ref, onValue, equalTo, query, orderByChild } from "firebase/database";
import "./Dashboard.css";
// Import role-specific components
import { EmployerWidgets } from '../components/RoleWidgets/Employer/EmployerWidgets';
import { FreelancerWidgets } from "../components/RoleWidgets/Freelancer/FreelancerWidgets";

const Dashboard = () => {
  const [firstname, setFirstname] = useState("User"); // Default to "User"
  const [taxData, setTaxData] = useState({});
  const [businessName, setBusinessName] = useState(""); // New state for business name
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true) 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading (true)
      console.log ("test")
      if (user) {
        const userId = user.uid;

        const userRef = ref(db, "users/" + userId);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUserRole(userData.role || "No role assigned");
            setFirstname(userData.firstname || "User"); // Fetch firstname from Firebase
            if (userData.role === "Employer") {
              setBusinessName(userData.businessName || "Business Name Not Available"); // Fetch business name
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
          const fetchExpenses = async () => {
            const expenseRef = ref(db, "expenseCollection");
            const q = query(expenseRef, orderByChild("employer"), equalTo(userId));
            let data = {};
            
            onValue(q, (snapshot) => {
              data = snapshot.val();
            });
          
            // Check if data exists before calling Object.entries
            if (!data) {
              return []; // Return an empty array if there's no data
            }
          
            const expenseArray = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...value,
            }));
          
            return expenseArray;
          };
          
       const data = await fetchExpenses ()

       const filterData = data.filter((expense)=> expense.accepted === undefined )
       setExpenseData(filterData)
       console.log(data)
      }
      fetchdata()
        setLoading (false)
      } else {
        // User is signed out
        setUserRole(""); // Reset role or handle as needed
        setTaxData({});
        setIncomeData([]);
        setLoading(false);
      }
    });
    
   
    
    return () => unsubscribe(); // Clean up the subscription
  }, []);

  console.log(expenseData)
  if (loading){
    return <h2> loading </h2>
  }
  return (
    <div className="dashboard-container">
      <div>
        <h1>Welcome, {firstname}!</h1>
        <p>Your role: {userRole}</p> {/* Display the user's role here */}
        {userRole === "Employer" && <p>Your Business: {businessName}</p>}

      </div>

      <div className="dashboard-widgets">
        {userRole === "Freelancer" ? (
          <FreelancerWidgets taxData={taxData} incomeData={incomeData} />
        ) : (
          <EmployerWidgets expenseData = {expenseData} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
