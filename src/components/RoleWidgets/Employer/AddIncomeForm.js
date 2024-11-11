import React, { useState, useEffect } from "react";
import { ref, onValue, get, push } from "firebase/database";
import { db, auth } from "../../../firebase"; // Adjust the import to your structure
import { useNavigate } from "react-router-dom";
import "../Freelancer/DailyIncome.css";

const AddIncomeForm = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState(""); // Selected freelancer
  const [freelancerState, setFreelancerState] = useState(""); // State of the selected freelancer
  const [jobs, setJobs] = useState([]); // Jobs linked to the selected freelancer
  const [selectedJob, setSelectedJob] = useState(null); // Selected job
  const [service, setService] = useState(""); // Service description
  const [amount, setAmount] = useState(0); // Amount earned
  const [date, setDate] = useState(""); // Date of service
  const [estimatedTax, setEstimatedTax] = useState(0); // Estimated tax
  const [taxRate, setTaxRate] = useState(0); // State-specific tax rate
  const navigate = useNavigate();

  // Fetch freelancers who are linked to the employer
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

  // Fetch the tax rate when a freelancer is selected
  useEffect(() => {
    if (selectedFreelancer) {
      const freelancer = freelancers.find(
        (freelancer) => freelancer.id === selectedFreelancer
      );
      if (freelancer && freelancer.state) {
        setFreelancerState(freelancer.state);
        const stateRef = ref(db, `statesCollection/${freelancer.state}`);
        get(stateRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const stateData = snapshot.val();
              setTaxRate(stateData.taxRate || 0);
            } else {
              console.warn("No tax rate data available for this state.");
              setTaxRate(0); // Default to 0 if not found
            }
          })
          .catch((error) => {
            console.error("Error fetching tax rate:", error);
            setTaxRate(0);
          });
      } else {
        setTaxRate(0); // Default to 0 if no state found
      }
    }
  }, [selectedFreelancer, freelancers]);

  // Update the estimated tax whenever the amount or tax rate changes
  useEffect(() => {
    setEstimatedTax(amount * taxRate);
  }, [amount, taxRate]);

  // Handle income submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const employerId = auth.currentUser?.uid;
    if (!employerId) {
      alert("You must be logged in to submit income entries.");
      return;
    }

    // Validate inputs
    if (!selectedFreelancer || !selectedJob || !service || !amount || !date) {
      alert("Please fill in all fields.");
      return;
    }

    // Prepare the income entry
    const incomeEntry = {
      jobId: selectedJob.jobId,
      service,
      amount: parseFloat(amount),
      date,
      estimatedTax,
    };

    // Store the income entry under the selected freelancer and job
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

export default AddIncomeForm;
