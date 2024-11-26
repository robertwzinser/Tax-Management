import React, { useState, useEffect } from "react";
import { ref, set, get, push } from "firebase/database";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./JobBoard.css";

const FreelancerJobBoard = ({ jobs, setMessages }) => {
  const [employerDetails, setEmployerDetails] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Extract unique employer IDs from jobs
    const employerIds = [...new Set(jobs.map(([_, job]) => job.employerId))];
    const fetchEmployerDetails = async () => {
      let details = {};
      for (const id of employerIds) {
        const empRef = ref(db, `users/${id}`);
        const snapshot = await get(empRef);
        if (snapshot.exists()) {
          // Employer's business name is stored under 'businessName'
          details[id] = snapshot.val().businessName || "Unknown Business";
        }
      }
      setEmployerDetails(details);
    };

    if (employerIds.length > 0) {
      fetchEmployerDetails();
    }
  }, [jobs]); // Depend on jobs

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleRequestJob = async (jobId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const jobRef = ref(db, `jobs/${jobId}`);
    const requestRef = ref(db, `jobs/${jobId}/requests/${userId}`);
    const freelancerRef = ref(db, `users/${userId}`);
    const userJobs = ref (db, `users/${userId}/jobs`)

    try {
      const freelancerData = (await get(freelancerRef)).val();
      const freelancerName = `${freelancerData.firstname} ${freelancerData.lastname}`;
      const userjobdata = await get(userJobs)
      const jobData = (await get(jobRef)).val();
      if (userjobdata.exists()){
        const data = userjobdata.val()
        for(const [id, job] of Object.entries(data) ){
          const currentStartDate= new Date (job.startDate).getTime()
          const currentEndDate= new Date (job.endDate).getTime()
          const newStartDate= new Date (jobData.startDate).getTime()
          const newEndDate= new Date (jobData.endDate).getTime()
          if(newStartDate < currentEndDate && newEndDate > currentStartDate){
            alert("Cannot request Job")
            return

          }
        }
      }

      await set(requestRef, {
        status: "requested",
        freelancerId: userId,
        freelancerName,
      });

     
      const employerId = jobData.employerId;
      const notificationRef = ref(db, `notifications/${employerId}`);
      await push(notificationRef, {
        type: "job-request",
        message: `New job request from ${freelancerName}.`,
        fromName: freelancerName,
        freelancerId: userId,
        jobId,
        timestamp: Date.now(),
        redirectUrl: "/job-board",
      });

      alert("Job request sent successfully.");
    } catch (error) {
      console.error("Error sending job request:", error.message);
      alert("Error sending job request. Please try again.");
    }
  };

  return (
    <div>
      <h1>Available Jobs</h1>
      <div className="job-list">
        {jobs.length > 0 ? (
          jobs.map(([id, job]) => {
            const hasRequested =
              job.requests &&
              job.requests[auth.currentUser?.uid] &&
              job.requests[auth.currentUser?.uid].status === "requested";
            const isAccepted = job.status === "accepted";

            return (
              <div className="job-item" key={id}>
                <h2>{job.title}</h2>
                <p>
                  <strong>
                    Posted by: {employerDetails[job.employerId] || ""}
                  </strong>
                </p>
                <p>{job.description}</p>
                <p>Hourly Rate: ${job.payment}</p>
                <p>
                  Starts: {job.startDate} and Ends: {job.endDate}
                </p>
                <p>
                  Status:{" "}
                  {isAccepted
                    ? "Accepted"
                    : hasRequested
                    ? "Requested"
                    : "Open"}
                </p>
                <button onClick={() => handleViewProfile(job.employerId)}>
                  View Employer Profile
                </button>

                {!isAccepted && !hasRequested && (
                  <button
                    style={{ backgroundColor: "#295442" }}
                    onClick={() => handleRequestJob(id)}
                  >
                    Request Job
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p>No jobs available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default FreelancerJobBoard;
