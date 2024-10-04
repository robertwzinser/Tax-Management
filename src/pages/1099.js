import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database"; // For fetching/saving data
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

const DailyIncome = () => {
  const [employers, setEmployers] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [service, setService] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [estimatedTax, setEstimatedTax] = useState(0);
  const [incomeData, setIncomeData] = useState([]);
  const navigate = useNavigate();

  // Fetch employers from the database
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const employersRef = ref(db, "employers/" + userId);
      onValue(employersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEmployers(Object.values(data)); // Assume employers are stored as an object with client details
        }
      });
    }
  }, []);

  // Fetch income entries from the database for the logged-in user
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const incomeRef = ref(db, "incomeEntries/" + userId);
      onValue(incomeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setIncomeData(Object.values(data)); // Assuming income entries are stored as objects
        }
      });
    }
  }, []);

  // Calculate estimated tax based on the amount
  useEffect(() => {
    const taxRate = 0.2; // Example tax rate
    setEstimatedTax(amount * taxRate);
  }, [amount]);

  // Handle income submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("You must be logged in to submit income entries.");
      return;
    }

    // Validate inputs
    if (!selectedClient || !service || !amount || !date) {
      alert("Please fill in all fields.");
      return;
    }

    // Push the new income entry to the database
    const incomeEntry = {
      client: selectedClient,
      service,
      amount: parseFloat(amount),
      date,
      estimatedTax,
    };

    const incomeRef = ref(db, "incomeEntries/" + userId);
    try {
      await push(incomeRef, incomeEntry);
      alert("Daily income added successfully!");
      navigate("/dashboard"); // Redirect to the dashboard after submission
    } catch (error) {
      console.error("Error submitting daily income:", error.message);
      alert("Error submitting daily income. Please try again.");
    }
  };

  // Function to aggregate income by client and filter for 1099 threshold
  const generate1099Data = () => {
    const clientIncome = {};

    // Sum up income by client
    incomeData.forEach((entry) => {
      if (clientIncome[entry.client]) {
        clientIncome[entry.client] += entry.amount;
      } else {
        clientIncome[entry.client] = entry.amount;
      }
    });

    // Filter for clients who paid over $600
    const clientsOverThreshold = Object.entries(clientIncome).filter(
      ([client, totalIncome]) => totalIncome > 600
    );

    console.log("Clients who need 1099:", clientsOverThreshold);

    // Return the data for further use (e.g., passing it to the 1099 generator)
    return clientsOverThreshold;
  };

  return (
    <div className="daily-income-container">
      <h1>Log Your Daily Income</h1>

      <form onSubmit={handleSubmit} className="income-form">
        <label htmlFor="client">Select Employer:</label>
        <select
          id="employer"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          required
        >
          <option value="">-- Select an Employer --</option>
          {employers.map((client, index) => (
            <option key={index} value={client.name}>
              {client.name}
            </option>
          ))}
        </select>

        <label htmlFor="service">Service Rendered:</label>
        <input
          type="text"
          id="service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="Describe the service"
          required
        />

        <label htmlFor="amount">Amount Earned ($):</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount earned"
          required
        />

        <label htmlFor="date">Date of Service:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div className="estimated-tax">
          <p>
            Estimated Tax Liability: <strong>${estimatedTax.toFixed(2)}</strong>
          </p>
        </div>

        <button type="submit" className="submit-btn">
          Submit Income
        </button>
      </form>

      <button onClick={generate1099Data} className="generate-1099-btn">
        Generate 1099 Data
      </button>
    </div>
  );
};

export default DailyIncome;
