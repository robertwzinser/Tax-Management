import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import './FreelancerWidgets.css'; // Assuming you're importing your CSS

export const FreelancerWidgets = () => {
  const [employers, setEmployers] = useState([]); 
  const [selectedEmployer, setSelectedEmployer] = useState(""); 
  const [incomeData, setIncomeData] = useState([]); 
  const [chartInstance, setChartInstance] = useState(null); 

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
      onValue(linkedEmployersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const employersData = Object.entries(data).map(([id, employer]) => ({
            id,
            businessName: employer.name,
          }));
          setEmployers(employersData);
        }
      });
    }
  }, []);

  const handleEmployerChange = (e) => {
    const employerId = e.target.value;
    setSelectedEmployer(employerId);
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

  const aggregateIncomeByDate = (entries) => {
    const aggregated = {};
    entries.forEach((entry) => {
      if (aggregated[entry.date]) {
        aggregated[entry.date].amount += entry.amount;
        aggregated[entry.date].estimatedTax += entry.estimatedTax;
      } else {
        aggregated[entry.date] = {
          amount: entry.amount,
          estimatedTax: entry.estimatedTax,
        };
      }
    });
    return Object.entries(aggregated).map(([date, { amount, estimatedTax }]) => ({
      date,
      amount,
      estimatedTax,
    }));
  };

  const createIncomeChart = () => {
    const ctx = document.getElementById("incomeChart").getContext("2d");
    if (chartInstance) {
      chartInstance.destroy();
    }
    const aggregatedData = aggregateIncomeByDate(incomeData);
    const chartData = {
      labels: aggregatedData.map((entry) => entry.date),
      datasets: [
        {
          label: "Income",
          data: aggregatedData.map((entry) => entry.amount),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
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
    setChartInstance(newChartInstance);
  };

  useEffect(() => {
    if (incomeData.length > 0) {
      createIncomeChart();
    }
  }, [incomeData]);

  return (
    <div className="freelancer-widgets">
      <div className="card">
        <h2>Select Employer</h2>
        <select onChange={handleEmployerChange} value={selectedEmployer} className="custom-select">
          <option value="">-- Select an Employer --</option>
          {employers.map((employer) => (
            <option key={employer.id} value={employer.id}>
              {employer.businessName}
            </option>
          ))}
        </select>
      </div>

      <div className="card income-summary">
        <h2>Income Summary for {selectedEmployer ? employers.find((e) => e.id === selectedEmployer)?.businessName : "Selected Employer"}</h2>
        <div className="summary-info">
          <div className="summary-item">
            <h3>Total Income</h3>
            <p>${incomeData.reduce((acc, curr) => acc + curr.amount, 0) || "N/A"}</p>
          </div>
          <div className="summary-item">
            <h3>Estimated Taxes</h3>
            <p style={{ color: '#e74c3c' }}>${incomeData.reduce((acc, curr) => acc + curr.estimatedTax, 0) || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Income Over Time</h2>
        <canvas id="incomeChart"></canvas>
      </div>

      <div className="card">
        <h2>Add Daily Income</h2>
        <Link to="/daily-income" className="dashboard-btn">Add Income</Link>
      </div>
    </div>
  );
};
