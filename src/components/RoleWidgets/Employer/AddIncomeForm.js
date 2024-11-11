import React, { useState, useEffect } from "react";
import { ref, onValue, get, push } from "firebase/database";
import { db, auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";
import "../Freelancer/DailyIncome.css";

const AddIncomeForm = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [service, setService] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [estimatedTax, setEstimatedTax] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const employerId = auth.currentUser?.uid;
    if (employerId) {
      const freelancersRef = ref(db, `users`);
      onValue(freelancersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const freelancersData = Object.entries(data)
            .filter(
              ([id, user]) =>
                user.role === "Freelancer" && user.linkedEmployers?.[employerId]
            )
            .map(([id, user]) => ({
              id,
              fullname: `${user.firstname} ${user.lastname}`,
              state: user.state,
            }));
          setFreelancers(freelancersData);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (selectedFreelancer) {
      const selectedFreelancerDetails = freelancers.find(
        (freelancer) => freelancer.id === selectedFreelancer
      );
      if (selectedFreelancerDetails) {
        const stateRef = ref(
          db,
          `statesCollection/${selectedFreelancerDetails.state}`
        );
        get(stateRef).then((snapshot) => {
          if (snapshot.exists()) {
            setTaxRate(snapshot.val().taxRate || 0);
          } else {
            setTaxRate(0);
          }
        });
      }
    }
  }, [selectedFreelancer, freelancers]);

  useEffect(() => {
    const employerId = auth.currentUser?.uid;
    if (selectedFreelancer && employerId) {
      const jobsRef = ref(db, "jobs");
      onValue(jobsRef, (snapshot) => {
        const data = snapshot.val();
        const filteredJobs = [];
        for (const jobId in data) {
          const job = data[jobId];
          const requests = job.requests || {};
          for (const requestId in requests) {
            const request = requests[requestId];
            if (
              request.freelancerId === selectedFreelancer &&
              request.status === "accepted" &&
              job.employerId === employerId
            ) {
              filteredJobs.push({ ...job, jobId });
              break;
            }
          }
        }
        setJobs(filteredJobs);
      });
    } else {
      setJobs([]);
    }
  }, [selectedFreelancer]);

  useEffect(() => {
    setEstimatedTax(amount * taxRate);
  }, [amount, taxRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const employerId = auth.currentUser?.uid;
    if (!employerId) {
      alert("You must be logged in to submit income entries.");
      return;
    }
    if (!selectedFreelancer || !selectedJob || !service || !amount || !date) {
      alert("Please fill in all fields.");
      return;
    }

    const incomeEntry = {
      jobId: selectedJob.jobId,
      service,
      amount: parseFloat(amount),
      date,
      estimatedTax,
    };

    const incomeRef = ref(
      db,
      `users/${selectedFreelancer}/linkedEmployers/${employerId}/incomeEntries`
    );
    try {
      await push(incomeRef, incomeEntry);
      alert("Income added successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting income:", error.message);
      alert("Error submitting income. Please try again.");
    }
  };

  return (
    <div className="daily-income-container">
      <h1>Log Freelancer's Income</h1>

      <form onSubmit={handleSubmit} className="income-form">
        <label htmlFor="freelancer">Select Freelancer:</label>
        <select
          id="freelancer"
          value={selectedFreelancer}
          onChange={(e) => setSelectedFreelancer(e.target.value)}
          required
        >
          <option value="">-- Select a Freelancer --</option>
          {freelancers.map((freelancer) => (
            <option key={freelancer.id} value={freelancer.id}>
              {freelancer.fullname}
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
                <option key={job.jobId} value={JSON.stringify(job)}>
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

export default AddIncomeForm;
