import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database";
import { auth, db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import "./DailyIncome.css";

const DailyIncome = () => {
  const [employers, setEmployers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(""); // Selected employer
  const [jobs, setJobs] = useState([]); // Jobs linked to the selected employer
  const [selectedJob, setSelectedJob] = useState(null); // Selected job
  const [service, setService] = useState(""); // Service description
  const [amount, setAmount] = useState(0); // Amount earned
  const [date, setDate] = useState(""); // Date of service
  const [estimatedTax, setEstimatedTax] = useState(0); // Estimated tax
  const navigate = useNavigate();

  // Fetch linked employers from Firebase for the freelancer
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

  // Fetch jobs based on the selected employer, filtering by the freelancerId
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (selectedClient && userId) {
      const jobsRef = ref(db, `jobs/`);
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Filter jobs by employerId and freelancerId (only show jobs for the logged-in freelancer)
          const filteredJobs = Object.entries(data).filter(
            ([, job]) =>
              job.employerId === selectedClient && job.freelancerId === userId
          );
          setJobs(filteredJobs);
        }
      });
    } else {
      setJobs([]); // Reset jobs if no employer is selected
    }
  }, [selectedClient]);

  // Handle real-time tax calculation (e.g., 20% estimate)
  useEffect(() => {
    const taxRate = 0.2;
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
    if (!selectedClient || !selectedJob || !service || !amount || !date) {
      alert("Please fill in all fields.");
      return;
    }

    // Prepare the income entry
    const incomeEntry = {
      jobId: selectedJob.jobId, // Update to include jobId
      service,
      amount: parseFloat(amount),
      date,
      estimatedTax,
    };

    // Store the income entry under the selected employer and job
    const incomeRef = ref(
      db,
      `users/${userId}/linkedEmployers/${selectedClient}/incomeEntries`
    );
    try {
      await push(incomeRef, incomeEntry);
      alert("Daily income added successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting daily income:", error.message);
      alert("Error submitting daily income. Please try again.");
    }
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
          {employers.map((employer) => (
            <option key={employer.id} value={employer.id}>
              {employer.businessName}
            </option>
          ))}
        </select>

        {jobs.length > 0 && (
          <>
            <label htmlFor="job">Select Job:</label>
            <select
              id="job"
              value={selectedJob ? JSON.stringify(selectedJob) : ""}
              onChange={(e) => setSelectedJob(JSON.parse(e.target.value))}
              required
            >
              <option value="">-- Select a Job --</option>
              {jobs.map(([id, job]) => (
                <option
                  key={id}
                  value={JSON.stringify({
                    jobId: id,
                    employerId: job.employerId,
                    freelancerId: job.freelancerId,
                  })}
                >
                  {job.title}
                </option>
              ))}
            </select>
          </>
        )}

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
    </div>
  );
};

export default DailyIncome;
