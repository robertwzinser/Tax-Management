import React, { useState } from "react";
import { ref, update, get, query, orderByChild, equalTo } from "firebase/database";
import { auth, db } from "../../firebase";
import "./JobBoard.css";

const FreelancerJobBoard = ({ jobs, setMessages }) => {
  const [acceptedJob, setAcceptedJob] = useState(null);
  const [message, setMessage] = useState("");

  const handleAcceptJob = async (jobId, employerId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return; // Only freelancers can accept jobs

    
    let data = {}
    const businessRef = ref (db, "businesses")
    const userBusiness = query (businessRef, orderByChild ("owner"), equalTo(employerId))
    try {
    const snapshot = await get (userBusiness) 
    if (snapshot.exists())
    data = snapshot.val()
    console.log(data)
    }
    catch (error){console.log(error)}
    console.log(data)
    const business = Object.entries (data).map(([key, value]) => ({
      id: key, ... value
    }))
    console.log(business)
    const jobRef = ref(db, `businesses/${business[0].id}/jobs/active/${jobId}`);
    const freelancerRef = ref(db, `users/${userId}/linkedEmployers`);

    try {
      await update(jobRef, { freelancerId: userId, status: "accepted" });

      const jobData = (await get(jobRef)).val();
      if (jobData) {
        const employerId = jobData.employerId;
        const employerRef = ref(db, `users/${employerId}`);
        const employerData = (await get(employerRef)).val();

        const employerName = `${employerData.businessName}`;
        const freelancerData = (await get(freelancerRef)).val();

        const updatedEmployers = freelancerData
          ? { ...freelancerData, [employerId]: { name: employerName } }
          : { [employerId]: { name: employerName } };

        await update(freelancerRef, updatedEmployers);
      }

      alert("Job accepted successfully!");
      setAcceptedJob(jobId);
    } catch (error) {
      console.error("Error accepting job:", error.message);
      alert("Error accepting job. Please try again.");
    }
    
  };
  console.log (jobs)
  return (
    <div>
      <h1>Available Jobs</h1>
      <div className="job-list">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="job-item">
              <h2>{job.title}</h2>
              <p>{job.description}</p>
              <p>Hourly Rate: ${job.payment}</p>
              <p>Deadline: {job.deadline}</p>
              <p>Status: {job.status}</p>
              {job.status === "open" && (
                <button
                  onClick={() => handleAcceptJob(job.id, job.employerId)}
                  className="accept-btn"
                >
                  Accept Job
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No jobs available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default FreelancerJobBoard;
