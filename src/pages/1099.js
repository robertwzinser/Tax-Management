import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "./1099.css";

const Generate1099 = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    address: "",
    profession: "",
  });
  const [clientsOverThreshold, setClientsOverThreshold] = useState([]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      // Fetch profile data
      const userRef = ref(db, "users/" + userId);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setProfileData(data || {});
      });

      // Fetch income data
      const incomeRef = ref(db, "incomeEntries/" + userId);
      onValue(incomeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const incomeList = Object.values(data);
          setIncomeData(incomeList);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Filter clients with income over $600
    const filteredClients = incomeData.filter((entry) => entry.amount > 600);
    setClientsOverThreshold(filteredClients);
  }, [incomeData]);

  const handleGenerate = () => {
    if (clientsOverThreshold.length === 0) {
      alert("No clients with income over $600.");
      return;
    }

    const form1099 = clientsOverThreshold.map((client) => ({
      clientName: client.client,
      totalIncome: client.amount,
      userName: profileData.firstname + " " + profileData.lastname,
      address: profileData.address,
      profession: profileData.profession,
    }));

    console.log("Generated 1099 form data:", form1099);
    // Trigger PDF download or form rendering 
  };

  return (
    <div className="generate-1099-container">
      <h1>Generate 1099 Form</h1>
      <div className="generate-1099-info">
        <p>Name: {profileData.firstname} {profileData.lastname}</p>
        <p>Address: {profileData.address}</p>
        <p>Profession: {profileData.profession}</p>
      </div>
      <div className="generate-1099-clients">
        <h2>Clients Over $600</h2>
        {clientsOverThreshold.length === 0 ? (
          <p>No clients exceed the $600 threshold.</p>
        ) : (
          <ul>
            {clientsOverThreshold.map((client, index) => (
              <li key={index}>
                {client.client}: ${client.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={handleGenerate} className="generate-btn">Generate 1099</button>
    </div>
  );
};

export default Generate1099;

