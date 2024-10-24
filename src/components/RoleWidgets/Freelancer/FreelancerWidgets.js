import React, { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { auth, db } from "../../../firebase";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import "./FreelancerWidgets.css"; // Assuming you're importing your CSS

export const FreelancerWidgets = () => {
  const [employers, setEmployers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [incomeData, setIncomeData] = useState([]);
  const chartRef = useRef(null); // Ref for the canvas
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      // Fetch linked employers for the logged-in freelancer
      const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
      onValue(linkedEmployersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const employersData = Object.entries(data).map(([id, employer]) => ({
            id,
            businessName: employer.name,
            incomeEntries: employer.incomeEntries || {}, // Save income entries for later
          }));
          setEmployers(employersData);
        }
      });
    }
  }, []);

  // Fetch jobs under selected employer that the freelancer works for
  const handleEmployerChange = (e) => {
    const employerId = e.target.value;
    setSelectedEmployer(employerId);
    setSelectedJob(""); // Reset job selection when employer changes

    if (employerId === "") {
      // Reset when no employer is selected
      setJobs([]);
      setIncomeData([]);
      return;
    }

    const userId = auth.currentUser?.uid;
    if (userId) {
      const jobsRef = ref(db, "jobs");
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Filter jobs where freelancerId matches the logged-in user
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

      // Fetch income data for the selected employer
      const selectedEmployerData = employers.find(
        (emp) => emp.id === employerId
      );
      const allIncomeEntries = Object.values(
        selectedEmployerData.incomeEntries || {}
      );
      setIncomeData(allIncomeEntries);
    }
  };

  // Fetch income data for selected job
  const handleJobChange = (e) => {
    const jobId = e.target.value;
    setSelectedJob(jobId);

    if (jobId) {
      const selectedEmployerData = employers.find(
        (emp) => emp.id === selectedEmployer
      );
      const jobIncomeEntries = Object.values(
        selectedEmployerData.incomeEntries || {}
      ).filter((entry) => entry.jobId === jobId);
      setIncomeData(jobIncomeEntries.length ? jobIncomeEntries : []); // Set empty if no data
    } else {
      // If no job selected, show combined data for all jobs under employer
      const selectedEmployerData = employers.find(
        (emp) => emp.id === selectedEmployer
      );
      setIncomeData(Object.values(selectedEmployerData.incomeEntries || {}));
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
    return Object.entries(aggregated).map(
      ([date, { amount, estimatedTax }]) => ({
        date,
        amount,
        estimatedTax,
      })
    );
  };

  const createIncomeChart = () => {
    // Destroy the existing chart if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Only create chart if income data exists
    const ctx = chartRef.current;
    if (incomeData.length > 0) {
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
    }
  };

  useEffect(() => {
    if (incomeData.length > 0) {
      createIncomeChart();
    } else if (chartInstance) {
      chartInstance.destroy(); // Destroy chart when there's no data
    }
  }, [incomeData]);

  const totalIncome =
    incomeData.length > 0
      ? incomeData.reduce((acc, curr) => acc + curr.amount, 0)
      : "N/A";
  const estimatedTaxes =
    incomeData.length > 0
      ? incomeData.reduce((acc, curr) => acc + curr.estimatedTax, 0)
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
          <option value="">-- Select an Employer --</option>
          {employers.map((employer) => (
            <option key={employer.id} value={employer.id}>
              {employer.businessName}
            </option>
          ))}
        </select>

        {selectedEmployer && (
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
        <h2>
          Income Summary{" "}
          {selectedJob
            ? `for ${jobs.find((j) => j.jobId === selectedJob)?.title}`
            : `for All Jobs under ${
                employers.find((e) => e.id === selectedEmployer)?.businessName
              }`}
        </h2>
        <div className="summary-info">
          <div className="summary-item">
            <h3>Total Income</h3>
            <p>${totalIncome}</p>
          </div>
          <div className="summary-item">
            <h3>Estimated Taxes</h3>
            <p style={{ color: "#e74c3c" }}>${estimatedTaxes}</p>
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
