import React, { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../../firebase";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import "./FreelancerWidgets.css";

export const FreelancerWidgets = () => {
  const [employers, setEmployers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [incomeData, setIncomeData] = useState([]);
  const [totalIncomeView, setTotalIncomeView] = useState("weekly");
  const chartRef = useRef(null);
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
            incomeEntries: employer.incomeEntries || {},
          }));
          setEmployers(employersData);
          // Automatically load data for "All Employers" on page load
          fetchAllEmployersData(employersData);
        }
      });
    }
  }, []);

  // Fetch income data for "All Employers" on initial load
  const fetchAllEmployersData = (employersData) => {
    const allIncomeEntries = employersData.flatMap((employer) =>
      Object.values(employer.incomeEntries || {})
    );
    setIncomeData(
      allIncomeEntries.sort((a, b) => new Date(a.date) - new Date(b.date))
    );
  };

  const handleEmployerChange = (e) => {
    const employerId = e.target.value;
    setSelectedEmployer(employerId);
    setSelectedJob("");

    if (employerId === "all") {
      fetchAllEmployersData(employers);
    } else {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const jobsRef = ref(db, "jobs");
        onValue(jobsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const filteredJobs = Object.entries(data)
              .filter(
                ([jobId, job]) =>
                  job.employerId === employerId && job.freelancerId === userId
              )
              .map(([jobId, job]) => ({
                jobId,
                title: job.title,
              }));
            setJobs(filteredJobs);
          }
        });

        const selectedEmployerData = employers.find(
          (emp) => emp.id === employerId
        );
        const allIncomeEntries = Object.values(
          selectedEmployerData.incomeEntries || {}
        );
        setIncomeData(
          allIncomeEntries.sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      }
    }
  };

  const handleJobChange = (e) => {
    const jobId = e.target.value;
    setSelectedJob(jobId);

    if (selectedEmployer === "all") {
      const allIncomeEntries = employers.flatMap((employer) =>
        Object.values(employer.incomeEntries || {})
      );
      setIncomeData(
        allIncomeEntries.sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    } else if (jobId) {
      const selectedEmployerData = employers.find(
        (emp) => emp.id === selectedEmployer
      );
      const jobIncomeEntries = Object.values(
        selectedEmployerData.incomeEntries || {}
      ).filter((entry) => entry.jobId === jobId);
      setIncomeData(jobIncomeEntries.length ? jobIncomeEntries : []);
    } else {
      const selectedEmployerData = employers.find(
        (emp) => emp.id === selectedEmployer
      );
      setIncomeData(
        Object.values(selectedEmployerData.incomeEntries || {}).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
      );
    }
  };

  const filterIncomeByRange = (entries) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(); 
  
    if (totalIncomeView === "weekly") {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0); 
    } else if (totalIncomeView === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
      startDate.setDate(1); 
      startDate.setHours(0, 0, 0, 0);
  
      endDate = new Date(now.getFullYear(), now.getMonth(), 1); 
    } else if (totalIncomeView === "quarterly") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startQuarterMonth = currentQuarter * 3 - 3; 
      startDate.setMonth(startQuarterMonth);
      startDate.setDate(1); 
      startDate.setHours(0, 0, 0, 0);
  
      endDate.setMonth(currentQuarter * 3); 
      endDate.setDate(1);
    } else if (totalIncomeView === "annually") {
      startDate.setFullYear(now.getFullYear() - 1); 
      startDate.setMonth(0); 
      startDate.setDate(1); 
      startDate.setHours(0, 0, 0, 0);
  
      endDate = new Date(now.getFullYear(), 0, 1); 
    }
  
    const filteredEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate < endDate;
    });
  
    console.log("Filtered Data:", filteredEntries); // Log filtered data to inspect
    return filteredEntries;
  };
  
  const aggregateIncome = (data) => {
    if (totalIncomeView === "annually") {
      // Annual aggregation: Sum all income amounts for the entire year
      const totalIncome = data.reduce((sum, entry) => sum + entry.amount, 0);
      console.log("Aggregated Annual Data:", [{ date: "Total Annual Income", amount: totalIncome }]);
      return [{ date: "Total Annual Income", amount: totalIncome }];
    }
  
    if (totalIncomeView === "quarterly") {
      // Quarterly aggregation: Sum income amounts by quarter
      const quarterlyIncome = {};
      data.forEach((entry) => {
        const date = new Date(entry.date);
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const key = `${year}-Q${quarter}`;
  
        if (!quarterlyIncome[key]) {
          quarterlyIncome[key] = 0;
        }
        quarterlyIncome[key] += entry.amount;
      });
      console.log("Aggregated Quarterly Data:", quarterlyIncome);
  
      return Object.keys(quarterlyIncome)
        .sort() // Sort quarters in chronological order
        .map((key) => ({ date: key, amount: quarterlyIncome[key] }));
    }
  
    if (totalIncomeView === "monthly") {
      // Monthly aggregation: Sum income amounts by month
      const monthlyIncome = {};
      data.forEach((entry) => {
        const date = new Date(entry.date);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // Format: YYYY-MM
  
        if (!monthlyIncome[yearMonth]) {
          monthlyIncome[yearMonth] = 0;
        }
        monthlyIncome[yearMonth] += entry.amount;
      });
      console.log("Aggregated Monthly Data:", monthlyIncome);
  
      return Object.keys(monthlyIncome)
        .sort() // Sort months in chronological order
        .map((key) => ({ date: key, amount: monthlyIncome[key] }));
    }
  
    if (totalIncomeView === "weekly") {
      // Weekly aggregation: Sum income amounts by week
      const weeklyIncome = {};
      data.forEach((entry) => {
        const date = new Date(entry.date);
        const year = date.getFullYear();
        const week = getWeekNumber(date); // Helper function to get week number
        const key = `${year}-W${week}`;
  
        if (!weeklyIncome[key]) {
          weeklyIncome[key] = 0;
        }
        weeklyIncome[key] += entry.amount;
      });
      console.log("Aggregated Weekly Data:", weeklyIncome);
  
      return Object.keys(weeklyIncome)
        .sort() // Sort weeks in chronological order
        .map((key) => ({ date: key, amount: weeklyIncome[key] }));
    }
  
    // Default: Return raw data if no valid view is selected
    console.log("Raw Data:", data);
    return data.map((entry) => ({ date: entry.date, amount: entry.amount }));
  };
  
  // Helper function to get the week number of the year
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000; // Convert milliseconds to days
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  
  const createIncomeChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  
    const ctx = chartRef.current;
    const filteredData = filterIncomeByRange(incomeData);
    const aggregatedData = aggregateIncome(filteredData);
  
    if (aggregatedData.length === 0) {
      console.log("No data to display in chart.");
      return; // Exit if no data to display
    }
  
    console.log("Chart Data:", aggregatedData); // Log final data used in chart
    const chartData = {
      labels: aggregatedData.map((entry) => entry.date),
      datasets: [
        {
          label: "Income",
          data: aggregatedData.map((entry) => entry.amount),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          tension: 0.4,
        },
      ],
    };
  
    const newChartInstance = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Income: $${context.raw}`;
              },
            },
          },
        },
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
    } else if (chartInstance) {
      chartInstance.destroy();
    }
  }, [incomeData, totalIncomeView]);

  const totalIncome =
    incomeData.length > 0
      ? filterIncomeByRange(incomeData).reduce(
          (acc, curr) => acc + curr.amount,
          0
        )
      : "N/A";
  const estimatedTaxes =
    incomeData.length > 0
      ? filterIncomeByRange(incomeData).reduce(
          (acc, curr) => acc + curr.estimatedTax,
          0
        )
      : "N/A";

  return (
    <div className="freelancer-widgets">
      <div className="card">
        <h2>Select Employer</h2>
        <select
          onChange={handleEmployerChange}
          value={selectedEmployer}
          className="custom-select"
        >
          <option value="all">All Employers</option>
          {employers.map((employer) => (
            <option key={employer.id} value={employer.id}>
              {employer.businessName}
            </option>
          ))}
        </select>

        {selectedEmployer !== "all" && (
          <div className="select-job">
            <h3>Select Job</h3>
            <select
              onChange={handleJobChange}
              value={selectedJob}
              className="custom-select"
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.jobId} value={job.jobId}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card income-summary">
        <h2>Income Summary</h2>
        <div className="summary-info">
          <div className="summary-item">
            <h3>Total Income</h3>
            <p>${totalIncome}</p>
          </div>
          <div className="summary-item">
            <h3>Estimated Taxes</h3>
            <p style={{ color: "#e74c3c" }}>${estimatedTaxes}</p>
          </div>
          <div>
            <label>View Range:</label>
            <select
              onChange={(e) => setTotalIncomeView(e.target.value)}
              value={totalIncomeView}
              className="custom-select"
            >
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="quarterly">This Quarter</option>
              <option value="annually">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Income Over Time</h2>
        {incomeData.length > 0 ? (
          <canvas ref={chartRef}></canvas>
        ) : (
          <p>No data available</p>
        )}
      </div>

      <div className="card">
        <h2>Add Daily Income</h2>
        <Link to="/daily-income" className="dashboard-btn">
          Add Income
        </Link>
      </div>
    </div>
  );
};
