import React, { useState, useEffect } from "react";
import { ref, onValue, get, push } from "firebase/database";
import { auth, db } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import "./DailyIncome.css";

const DailyIncome = () => {
  const [employers, setEmployers] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [service, setService] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [estimatedTax, setEstimatedTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployers = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
      const snapshot = await get(linkedEmployersRef);
      const linkedEmployers = snapshot.val();
  
      if (linkedEmployers) {
        const employersData = [];
        for (const [id, employer] of Object.entries(linkedEmployers)) {
          const employerRef = ref(db, `users/${id}`);
          const empSnapshot = await get(employerRef);
          const employerData = empSnapshot.val();
  
          // Check if the employer has blocked the freelancer
          const isBlocked = employerData?.blockedUsers?.[userId]?.blocked;
          if (!isBlocked) {
            employersData.push({ id, businessName: employer.name });
          }
        }
        setEmployers(employersData); // Update state with filtered employers
      }
    };
  
    fetchEmployers();
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
          }));
          setEmployers(employersData);
        }
      });

      // Fetch the state of the logged-in freelancer and get their tax rate
      const freelancerRef = ref(db, `users/${userId}`);
      onValue(freelancerRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.state) {
          const freelancerState = data.state;
          const stateRef = ref(db, `statesCollection/${freelancerState}`);
          get(stateRef)
            .then((stateSnapshot) => {
              if (stateSnapshot.exists()) {
                const stateData = stateSnapshot.val();
                setTaxRate(stateData.taxRate || 0);
              } else {
                console.warn("No tax rate data available for this state.");
                setTaxRate(0); // Default to 0 if not found
              }
            })
            .catch((error) => {
              console.error("Error fetching tax rate:", error);
              setTaxRate(0); // Handle error gracefully
            });
        } else {
          console.warn("Freelancer's state not found.");
          setTaxRate(0); // Default to 0 if no state is found
        }
      });
    }
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (selectedClient && userId) {
      const jobsRef = ref(db, `jobs/`);
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const filteredJobs = Object.entries(data).filter(
            ([id, job]) =>
              job.employerId === selectedClient &&
              job.requests &&
              Object.values(job.requests).some(
                (request) =>
                  request.freelancerId === userId &&
                  request.status === "accepted"
              )
          );
          setJobs(filteredJobs.map(([id, job]) => ({ ...job, jobId: id })));
        }
      });
    } else {
      setJobs([]); // Reset jobs if no employer is selected
    }
  }, [selectedClient]);

  // Update the estimated tax whenever the amount or tax rate changes
  useEffect(() => {
    setEstimatedTax(parseFloat((amount * taxRate).toFixed(2))); // Calculate and round to 2 decimal places
  }, [amount, taxRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("You must be logged in to submit income entries.");
      return;
    }

    if (!selectedClient || !selectedJob || !service || !amount || !date) {
      alert("Please fill in all fields.");
      return;
    }

    const incomeEntry = {
      jobId: selectedJob.jobId,
      service,
      amount: parseFloat(amount), // Ensure amount is a float
      date,
      estimatedTax: parseFloat(estimatedTax), // Ensure estimatedTax is a float
    };

    if (
      new Date(date) < new Date(selectedJob.startDate) ||
      new Date(date) > new Date(selectedJob.endDate)
    ) {
      alert(
        "Income entry date must be within the job's start and end date range."
      );
      return;
    }

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
              {jobs.map((job) => (
                <option
                  key={job.jobId}
                  value={JSON.stringify({
                    jobId: job.jobId,
                    employerId: job.employerId,
                    freelancerId: job.freelancerId,
                    startDate: job.startDate,
                    endDate: job.endDate,
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
