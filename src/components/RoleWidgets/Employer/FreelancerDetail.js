import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { db, auth } from "../../../firebase";
import Chart from "chart.js/auto";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  MenuItem,
  Select,
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
  const [viewRange, setViewRange] = useState("monthly");
  const employerId = auth.currentUser.uid; // Assuming the current user's UID is the employer's ID

  useEffect(() => {
    const freelancerRef = ref(db, `users/${freelancerId}`);
    onValue(freelancerRef, (snapshot) => {
      const data = snapshot.val();
      setFreelancer({
        firstname: `${data.firstname}`,
        fullname: `${data.firstname} ${data.lastname}`,
        email: data.email,
      });
    });
  }, [freelancerId]);

  useEffect(() => {
    // This path assumes each freelancer has a sub-node for each employer under 'linkedEmployers'
    const incomeRef = ref(
      db,
      `users/${freelancerId}/linkedEmployers/${employerId}/incomeEntries`
    );
    onValue(incomeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIncomeData(Object.values(data));
      } else {
        setIncomeData([]);
      }
    });
  }, [freelancerId, employerId]);

  useEffect(() => {
    const employerId = auth.currentUser.uid; // This assumes you're logged in and have an ID
    const jobsRef = ref(db, `jobs`);

    onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const jobsList = Object.entries(data)
          .filter(
            ([jobId, job]) =>
              job.employerId === employerId && // Ensure only jobs from this employer are included
              Object.values(job.requests || {}).some(
                (request) =>
                  request.freelancerId === freelancerId &&
                  request.status === "accepted"
              )
          )
          .map(([jobId, job]) => ({
            ...job,
            jobId,
          }));
        setJobs(jobsList);
      } else {
        setJobs([]);
      }
    });
  }, [freelancerId, auth.currentUser.uid]); // Add employerId to the dependencies if it's dynamic

  useEffect(() => {
    const expensesRef = ref(db, "reimbursementCollection");
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
        const total = freelancerExpenses

          .filter((expense) => expense.accepted !== false)
          .reduce((sum, expense) => sum + parseFloat(expense.expense), 0);

        setTotalExpenses(total);
      } else {
        setExpenses([]);
        setTotalExpenses(0);
      }
    });
  }, [freelancerId]);

  const handleExpenseDecision = async (expenseId, decision) => {
    const expenseRef = ref(db, `reimbursementCollection/${expenseId}`);
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
        aggregated[entry.date] = { amount: entry.amount };
      }
    });
    return Object.entries(aggregated).map(([date, { amount }]) => ({
      date,
      amount,
    }));
  };

  const filterIncomeByRange = (entries) => {
    const now = new Date();
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      if (viewRange === "weekly") {
        return entryDate >= new Date(now.setDate(now.getDate() - 7));
      } else if (viewRange === "monthly") {
        return entryDate >= new Date(now.setMonth(now.getMonth() - 1));
      } else if (viewRange === "quarterly") {
        return entryDate >= new Date(now.setMonth(now.getMonth() - 3));
      } else if (viewRange === "annually") {
        return entryDate >= new Date(now.setFullYear(now.getFullYear() - 1));
      } else if (viewRange === "all-time") {
        return true;
      }
      return true;
    });
  };

  const createIncomeChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = document
      .getElementById("freelancerIncomeChart")
      .getContext("2d");
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
  };

  useEffect(() => {
    if (incomeData.length > 0) {
      createIncomeChart();
    }
  }, [incomeData, viewRange]);

  const calculateOverallIncome = () => {
    const filteredData = filterIncomeByRange(incomeData);
    return filteredData.reduce((acc, curr) => acc + curr.amount, 0);
  };

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

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h3">
              {freelancer.firstname}'s overall income with you over
              <Select
                value={viewRange}
                onChange={(e) => setViewRange(e.target.value)}
                sx={{
                  ml: 2,
                  mb: 2,
                  mr: 2,
                  color: "#ffffff",
                  backgroundColor: "#333333",
                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor: "#555555",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#888888",
                  },
                  ".MuiSvgIcon-root": {
                    color: "#ffffff",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#333333",
                      color: "#ffffff",
                    },
                  },
                }}
              >
                <MenuItem value="all-time">All Time</MenuItem>
                <MenuItem value="weekly">This Week</MenuItem>
                <MenuItem value="monthly">This Month</MenuItem>
                <MenuItem value="quarterly">This Quarter</MenuItem>
                <MenuItem value="annually">This Year</MenuItem>
              </Select>
              has been <strong>${calculateOverallIncome().toFixed(2)}</strong>.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography></Typography>
            </Box>
            <canvas id="freelancerIncomeChart"></canvas>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
              Jobs Worked
            </Typography>
            {jobs.length === 0 ? (
              <Typography>No jobs completed by this freelancer yet.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {jobs.map((job, index) => (
                  <Accordion
                    key={index}
                    sx={{ backgroundColor: "#1e1e1e", color: "white" }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                    >
                      <Typography variant="h6">{job.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">{job.description}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Payment to Date: $
                        {incomeData
                          .filter((entry) => entry.jobId === job.jobId)
                          .reduce((acc, entry) => acc + entry.amount, 0)}
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
            <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
              Freelancer Reimbursements (Total: ${totalExpenses.toFixed(2)})
            </Typography>
            {expenses.length > 0 ? (
              expenses.map((expense, index) => (
                <Accordion
                  key={index}
                  sx={{ backgroundColor: "#1e1e1e", color: "white" }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
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
              <Typography>No expenses submitted by this freelancer.</Typography>
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
              Add Income for This Employee
            </Button>
          </Box>
        </>
      )}
    </div>
  );
};

export default FreelancerDetail;
