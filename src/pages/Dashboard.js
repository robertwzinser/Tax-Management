import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, remove, onValue, equalTo, query, orderByChild, get } from "firebase/database";
import "./Dashboard.css";
// Import role-specific components
import { EmployerWidgets } from "../components/RoleWidgets/EmployerWidgets";
import { FreelancerWidgets } from "../components/RoleWidgets/FreelancerWidgets";

const Dashboard = () => {
  const navigate = useNavigate();
  const [firstname, setFirstname] = useState("User"); // Default to "User"
  const [taxData, setTaxData] = useState({});
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
          const expenseRef = ref(db, "expenseCollection")
          const q = query(expenseRef, orderByChild ("employer"), equalTo(userId))
          let data = {}
          onValue(q, (snapshot) => {
           data = snapshot.val()
          });

          const expenseArray = Object.entries (data).map (([key, value]) => ({
            id: key, ...value
          }))
          return expenseArray
        }
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

  const reauthenticate = async () => {
    const user = auth.currentUser;
    if (!user) return false;

    const email = user.email;
    const password = prompt(
      "Please confirm your password to delete your account:"
    );
    const credential = EmailAuthProvider.credential(email, password);

    try {
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error("Re-authentication failed:", error.message);
      alert("Re-authentication failed. Please try again.");
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "Are you sure you want to delete your account?"
    );
    if (confirmation) {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;

          const reauthenticated = await reauthenticate();
          if (!reauthenticated) return;

          await remove(ref(db, "users/" + userId));
          await deleteUser(user);

          alert("Account successfully deleted.");
          navigate("/sign-in");
        }
      } catch (error) {
        console.error(
          "There was a problem deleting your account:",
          error.message
        );
        alert("There was a problem deleting your account. Please try again.");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("There was a problem signing out:", error.message);
    }
  };
  console.log(expenseData)
  if (loading){
    return <h2> loading </h2>
  }
  return (
    <div className="dashboard-container">
      <div>
        <h1>Welcome, {firstname}!</h1>
        <p>Your role: {userRole}</p> {/* Display the user's role here */}
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
