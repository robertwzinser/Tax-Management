import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth"; // Firebase auth listener
import jsPDF from "jspdf";
import "./1099.css";

const Generate1099 = () => {
  const [userRole, setUserRole] = useState(""); // Store role (freelancer or employer)
  const [employers, setEmployers] = useState([]); // Store linked employers for freelancers
  const [selectedEmployer, setSelectedEmployer] = useState(""); // Store selected employer
  const [incomeData, setIncomeData] = useState([]); // Store income data for the selected employer
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    address: "",
    profession: "",
  });
  const [loading, setLoading] = useState(true); // Track loading state

  // Use Firebase auth listener to manage user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;

        // Fetch profile data and determine user role
        const userRef = ref(db, "users/" + userId);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setProfileData({
              firstname: data.firstname || "",
              lastname: data.lastname || "",
              address: data.address || "",
              profession: data.profession || "",
              email: user.email,
            });
            setUserRole(data.role); // Set user role
          }
          setLoading(false); // Stop loading once user data is fetched
        });

        // Fetch linked employers if user is a freelancer
        if (userRole === "Freelancer") {
          const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
          onValue(linkedEmployersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const employersData = Object.entries(data).map(
                ([id, employer]) => ({
                  id,
                  businessName: employer.name,
                })
              );
              setEmployers(employersData);
            }
          });
        }
      } else {
        setUserRole(""); // Reset role when user is logged out
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [userRole]);

  // Fetch income data when an employer is selected
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (selectedEmployer && userId) {
      const incomeRef = ref(
        db,
        `users/${userId}/linkedEmployers/${selectedEmployer}/incomeEntries`
      );
      onValue(incomeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const incomeEntries = Object.values(data);
          setIncomeData(incomeEntries);
        } else {
          setIncomeData([]);
        }
      });
    }
  }, [selectedEmployer]);

  const handleEmployerChange = (e) => {
    setSelectedEmployer(e.target.value);
  };

  // Function to generate the PDF 1099 form
  const handleGenerate = () => {
    if (incomeData.length === 0) {
      alert("No income data available for the selected employer.");
      return;
    }

    const form1099 = incomeData.map((income) => ({
      clientName: employers.find((employer) => employer.id === selectedEmployer)
        ?.businessName,
      totalIncome: income.amount,
      userName: profileData.firstname + " " + profileData.lastname,
      address: profileData.address,
      profession: profileData.profession,
    }));

    // Generate PDF using jsPDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("1099 Form", 20, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${profileData.firstname} ${profileData.lastname}`, 20, 30);
    doc.text(`Address: ${profileData.address}`, 20, 40);
    doc.text(`Profession: ${profileData.profession}`, 20, 50);

    form1099.forEach((form, index) => {
      doc.text(`\nClient: ${form.clientName}`, 20, 60 + index * 20);
      doc.text(
        `Total Income: $${form.totalIncome.toFixed(2)}`,
        20,
        70 + index * 20
      );
    });

    // Save the PDF
    doc.save("1099_Form.pdf");
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <div className="generate-1099-container">
      <h1>Generate 1099 Form</h1>
      <div className="generate-1099-info">
        <p>
          Name: {profileData.firstname} {profileData.lastname}
        </p>
        <p>Address: {profileData.address}</p>
        <p>Profession: {profileData.profession}</p>
      </div>

      {userRole === "Freelancer" && (
        <>
          <div className="employer-select-container">
            <label htmlFor="employer-select">Select Employer:</label>
            <select
              id="employer-select"
              value={selectedEmployer}
              onChange={handleEmployerChange}
            >
              <option value="">-- Select an Employer --</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>
                  {employer.businessName}
                </option>
              ))}
            </select>
          </div>
          {selectedEmployer && (
            <div className="generate-1099-clients">
              <h2>
                Income for{" "}
                {
                  employers.find((employer) => employer.id === selectedEmployer)
                    ?.businessName
                }
              </h2>
              {incomeData.length === 0 ? (
                <p>No income data for the selected employer.</p>
              ) : (
                <ul>
                  {incomeData.map((income, index) => (
                    <li key={index}>
                      Service: {income.service} - Amount: $
                      {income.amount.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <button onClick={handleGenerate} className="generate-button">
        Generate 1099
      </button>
    </div>
  );
};

export default Generate1099;
