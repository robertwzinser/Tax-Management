import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../../firebase";
import Chart from "chart.js/auto";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "./FreelancerDetail.css";

const FreelancerDetail = () => {
  const { freelancerId } = useParams();
  const [freelancer, setFreelancer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0); 
  const [chartInstance, setChartInstance] = useState(null);

  // Fetch freelancer details
  useEffect(() => {
    const freelancerRef = ref(db, `users/${freelancerId}`);
    onValue(freelancerRef, (snapshot) => {
      const data = snapshot.val();
      setFreelancer({
        fullname: `${data.firstname} ${data.lastname}`,
        email: data.email,
      });
    });
  }, [freelancerId]);

  // Fetch linked income data using job IDs
  useEffect(() => {
    const incomeRef = ref(db, `users/${freelancerId}/linkedEmployers`);
    onValue(incomeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employerIncome = Object.entries(data).reduce(
          (acc, [employerId, employerData]) => {
            if (employerData.incomeEntries) {
              acc.push(...Object.values(employerData.incomeEntries));
            }
            return acc;
          },
          []
        );
        setIncomeData(employerIncome);
      } else {
        // If no data is returned, set empty income data
        setIncomeData([]);
      }
    });
  }, [freelancerId]);

  // Fetch jobs worked by the freelancer
  useEffect(() => {
    const jobsRef = ref(db, `jobs`);
    onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const jobsList = Object.entries(data)
          .filter(([jobId, job]) => job.freelancerId === freelancerId)
          .map(([jobId, job]) => ({ ...job, jobId }));
        setJobs(jobsList);
      } else {
        // If no data is returned, set empty jobs array
        setJobs([]);
      }
    });
  }, [freelancerId]);

  // Fetch freelancer expenses
  useEffect(() => {
    const expensesRef = ref(db, "expenseCollection");
    onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const freelancerExpenses = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((expense) => expense.userID === freelancerId);

        setExpenses(freelancerExpenses);

        // Calculate the total of accepted expenses and set it to the state
        const total = freelancerExpenses
          .filter((expense) => expense.accepted !== false)  // Exclude rejected expenses
          .reduce((sum, expense) => sum + parseFloat(expense.expense), 0);
          
        setTotalExpenses(total);
      } else {
        // If no data is returned, set empty expenses array
        setExpenses([]);
        setTotalExpenses(0); // Reset total if no expenses
      }
    });
  }, [freelancerId]);


  const handleExpenseDecision = async (expenseId, decision) => {
    const expenseRef = ref(db, `expenseCollection/${expenseId}`);
    try {
      await update(expenseRef, { accepted: decision });
      alert(`Expense ${decision ? "accepted" : "rejected"} successfully!`);
    } catch (error) {
      console.error("Error updating expense:", error.message);
      alert("Error updating expense. Please try again.");
    }
  };

  const aggregateIncomeByDate = (entries) => {
    const aggregated = {};
    entries.forEach((entry) => {
      if (aggregated[entry.date]) {
        aggregated[entry.date].amount += entry.amount;
      } else {
        aggregated[entry.date] = {
          amount: entry.amount,
        };
      }
    });
    return Object.entries(aggregated).map(([date, { amount }]) => ({
      date,
      amount,
    }));
  };

  const createIncomeChart = () => {
    const ctx = document
      .getElementById("freelancerIncomeChart")
      .getContext("2d");
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
          x: {
            grid: {
              color: "#222222", // Custom grid color for x-axis
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "#222222", // Custom grid color for y-axis
            },
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
    <div className="freelancer-detail">
      {freelancer && (
        <>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" component="h2">
              {freelancer.fullname}
            </Typography>
            <Typography variant="body1">Email: {freelancer.email}</Typography>
          </Box>

          <Box>
            <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
              Jobs Worked
            </Typography>
            {jobs.length === 0 ? (
              <Typography>No jobs completed by this freelancer yet.</Typography>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {jobs.map((job, index) => (
                  <Accordion
                    key={index}
                    sx={{
                      backgroundColor: "#1e1e1e",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      width: "100%", // Center with width control
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                      aria-controls={`panel-${index}-content`}
                      id={`panel-${index}-header`}
                    >
                      <Typography variant="h6">{job.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{job.description}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Payment to Date:{" "}
                        <strong>
                          $
                          {incomeData
                            .filter((entry) => entry.jobId === job.jobId)
                            .reduce((acc, entry) => acc + entry.amount, 0)}
                        </strong>
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Status: {job.status}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h3">
              Overall Income
            </Typography>
            <canvas id="freelancerIncomeChart"></canvas>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
              Freelancer Reimbursements (Total: ${totalExpenses.toFixed(2)}) {/* Display total */}
            </Typography>
            {expenses.length > 0 ? (
              expenses.map((expense, index) => (
                <Accordion
                  key={index}
                  sx={{
                    backgroundColor: "#1e1e1e",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    width: "100%", // Center with width control
                    transition: "transform 0.2s ease",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                    aria-controls={`expense-panel-${index}-content`}
                    id={`expense-panel-${index}-header`}
                  >
                    <Typography>
                      {expense.category}: ${expense.expense}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Date: {expense.date}
                    </Typography>
                    <Typography variant="body2">
                      <a
                        href={expense.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Receipt
                      </a>
                    </Typography>
                    {expense.accepted === undefined ? (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          class="freelancer-button-accept"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            handleExpenseDecision(expense.id, true)
                          }
                          sx={{ mr: 1 }}
                        >
                          Accept
                        </Button>
                        <Button
                          class="freelancer-button-reject"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            handleExpenseDecision(expense.id, false)
                          }
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1 }}
                        color={expense.accepted ? "success.main" : "error.main"}
                      >
                        {expense.accepted ? "Accepted" : "Rejected"}
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography>
                There have been no expenses submitted by this freelancer.
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 4 }}>
            <Button
              class="add-income-button"
              variant="contained"
              color="primary"
              component={Link}
              to={`/add-income/${freelancerId}`}
            >
              Add Income
            </Button>
          </Box>
        </>
      )}
    </div>
  );
};

export default FreelancerDetail;
