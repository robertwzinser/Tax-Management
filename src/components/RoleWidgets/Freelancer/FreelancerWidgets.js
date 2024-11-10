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
  const [totalIncomeView, setTotalIncomeView] = useState("all-time");
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [deductions, setDeductions] = useState([]);
  const [stateTaxRate, setStateTaxRate] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Fetch the user's profile to get the state
      const userProfileRef = ref(db, `users/${user.uid}`);
      onValue(userProfileRef, (snapshot) => {
        const userProfile = snapshot.val();
        if (userProfile && userProfile.state) {
          // Fetch the tax rate for the user's state
          const stateTaxRef = ref(
            db,
            `statesCollection/${userProfile.state}/taxRate`
          );
          onValue(stateTaxRef, (taxSnapshot) => {
            const stateTaxRate = taxSnapshot.val();
            setStateTaxRate(stateTaxRate); // Set the state tax rate
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const deductionsRef = ref(db, `deductionCollection/${userId}`);
      onValue(deductionsRef, (snapshot) => {
        const fetchedDeductions = snapshot.val();
        const deductionsList = fetchedDeductions
          ? Object.entries(fetchedDeductions).map(([key, item]) => ({
              id: key,
              ...item,
              date: new Date(item.date), // Convert stored date string to Date object
            }))
          : [];
        setDeductions(deductionsList);
      });
    }
  }, []);

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

  const calculateTotalIncome = () => {
    return incomeData.reduce((acc, curr) => acc + curr.amount, 0);
  };

  const calculateTotalDeductions = () => {
    const filteredDeductions = filterIncomeByRange(deductions);
    return filteredDeductions.reduce(
      (acc, curr) => acc + (curr.amount || 0),
      0
    );
  };

  const calculateAGI = () => {
    const totalIncome = calculateTotalIncome();
    const totalDeductions = calculateTotalDeductions();
    return totalIncome - totalDeductions;
  };

  const estimateTaxes = () => {
    const agi = calculateAGI();
    const stateTaxes = agi * stateTaxRate;
    return stateTaxes;
  };

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
                  job.employerId === employerId &&
                  Object.values(job.requests || {}).some(
                    (request) =>
                      request.freelancerId === userId &&
                      request.status === "accepted"
                  )
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

  const filterIncomeByRange = (entries) => {
    const now = new Date();
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      if (totalIncomeView === "weekly") {
        return entryDate >= new Date(now.setDate(now.getDate() - 7));
      } else if (totalIncomeView === "monthly") {
        return entryDate >= new Date(now.setMonth(now.getMonth() - 1));
      } else if (totalIncomeView === "quarterly") {
        return entryDate >= new Date(now.setMonth(now.getMonth() - 3));
      } else if (totalIncomeView === "annually") {
        return entryDate >= new Date(now.setFullYear(now.getFullYear() - 1));
      } else if (totalIncomeView === "all-time") {
        return true;
      }
      return true;
    });
  };

  const createIncomeChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartRef.current;
    if (incomeData.length > 0) {
      const filteredData = filterIncomeByRange(incomeData);
      const aggregatedData = aggregateIncomeByDate(filteredData);
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
    }
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

  const totalIncomeDisplay =
    totalIncome !== "N/A" ? `$${parseFloat(totalIncome).toFixed(2)}` : "N/A";
  const estimatedTaxesDisplay =
    estimatedTaxes !== "N/A"
      ? `$${parseFloat(estimatedTaxes).toFixed(2)}`
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
        <h2>Financial Summary</h2>
        <div className="summary-info">
          <div className="summary-item">
            <h3>Taxable Income</h3>
            <p>${calculateTotalIncome().toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Deductions</h3>
            <p>${calculateTotalDeductions().toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Adjusted Gross Income</h3>
            <p>${calculateAGI().toFixed(2)}</p>
          </div>
          <div className="summary-item">
            <h3>Estimated Taxes</h3>
            <p style={{ color: "#e74c3c" }}>${estimateTaxes().toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Income Over Time</h2>
        <select
          onChange={(e) => setTotalIncomeView(e.target.value)}
          value={totalIncomeView}
          className="custom-select"
        >
          <option value="all-time">All Time</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="annually">This Year</option>
        </select>

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
