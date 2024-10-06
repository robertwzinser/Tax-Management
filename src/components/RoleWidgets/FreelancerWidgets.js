import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";

export const FreelancerWidgets = () => {
  const [employers, setEmployers] = useState([]); // Stores linked employers
  const [selectedEmployer, setSelectedEmployer] = useState(""); // State for selected employer
  const [incomeData, setIncomeData] = useState([]); // State for income data of the selected employer
  const [chartInstance, setChartInstance] = useState(null); // Store the Chart.js instance

  // Fetch linked employers from Firebase for the freelancer
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
      onValue(linkedEmployersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Set employer business names from linkedEmployers data
          const employersData = Object.entries(data).map(([id, employer]) => ({
            id,
            businessName: employer.name, // Use business name instead of personal name
          }));
          setEmployers(employersData); // Set employers with business names
        }
      });
    }
  }, []);

  // Handle employer selection
  const handleEmployerChange = (e) => {
    const employerId = e.target.value;
    setSelectedEmployer(employerId);

    // Set the income data for the selected employer
    if (employers.find((employer) => employer.id === employerId)) {
      const employerDataRef = ref(
        db,
        `users/${auth.currentUser?.uid}/linkedEmployers/${employerId}/incomeEntries`
      );
      onValue(employerDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const incomeEntries = Object.values(data);
          setIncomeData(incomeEntries);
        } else {
          setIncomeData([]);
        }
      });
    } else {
      setIncomeData([]);
    }
  };

  // Function to create or update the income chart
  const createIncomeChart = () => {
    const ctx = document.getElementById("incomeChart").getContext("2d");

    // Destroy existing chart instance if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    const chartData = {
      labels: incomeData.map((entry) => entry.date), // X-axis (dates)
      datasets: [
        {
          label: "Income",
          data: incomeData.map((entry) => entry.amount), // Y-axis (amounts)
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };

    // Create new chart instance
    const newChartInstance = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Set the new chart instance to state
    setChartInstance(newChartInstance);
  };

  // Redraw the chart whenever income data changes
  useEffect(() => {
    if (incomeData.length > 0) {
      createIncomeChart();
    }
  }, [incomeData]);

  return (
    <>
      <div className="widget">
        <h2>Select Employer</h2>
        <select onChange={handleEmployerChange} value={selectedEmployer}>
          <option value="">-- Select an Employer --</option>
          {employers.map((employer) => (
            <option key={employer.id} value={employer.id}>
              {employer.businessName}
            </option>
          ))}
        </select>
      </div>

      <div className="widget">
        <h2>
          Income Summary for{" "}
          {selectedEmployer
            ? employers.find((e) => e.id === selectedEmployer)?.businessName
            : "Selected Employer"}
        </h2>
        <p>
          Total Income: $
          {incomeData.reduce((acc, curr) => acc + curr.amount, 0) || "N/A"}
        </p>
        <p>
          Estimated Taxes: $
          {incomeData.reduce((acc, curr) => acc + curr.estimatedTax, 0) ||
            "N/A"}
        </p>
      </div>

      <div className="widget">
        <h2>Income Over Time</h2>
        <canvas id="incomeChart"></canvas>
      </div>

      <div className="widget">
        <h2>Add Daily Income</h2>
        <Link to="/daily-income" className="dashboard-btn">
          Add Income
        </Link>
      </div>
    </>
  );
};
