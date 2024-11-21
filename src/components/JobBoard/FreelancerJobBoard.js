import React, { useState, useEffect } from "react";
import { ref, set, get, push, onValue } from "firebase/database";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import "./JobBoard.css";

const FreelancerJobBoard = ({ jobs, setMessages }) => {
  const [employerDetails, setEmployerDetails] = useState({});
  const [filteredJobs, setFilteredJobs] = useState([]); // Jobs excluding those from employers who blocked the freelancer
  const [blockedByEmployers, setBlockedByEmployers] = useState([]); // Employers that blocked the freelancer
  const navigate = useNavigate();

  // Fetch employers that have blocked the freelancer
  useEffect(() => {
    const fetchEmployersBlockingFreelancer = async () => {
      const freelancerId = auth.currentUser?.uid; // Current freelancer's UID
      if (!freelancerId) return;

      const employersRef = ref(db, "users");
      const snapshot = await get(employersRef);

      if (snapshot.exists()) {
        const blockedEmployers = Object.entries(snapshot.val())
          .filter(([employerId, employerData]) =>
            employerData.blockedUsers?.[freelancerId]?.blocked
          )
          .map(([employerId]) => employerId);

        setBlockedByEmployers(blockedEmployers);
      }
    };

    fetchEmployersBlockingFreelancer();
  }, []);

  // Filter jobs based on employers that blocked the freelancer
  useEffect(() => {
    const filterJobs = () => {
      const filtered = jobs.filter(
        ([_, job]) => !blockedByEmployers.includes(job.employerId)
      );
      setFilteredJobs(filtered);
    };

    if (jobs.length > 0 && blockedByEmployers.length >= 0) {
      filterJobs();
    }
  }, [jobs, blockedByEmployers]);

  // Fetch employer details
  useEffect(() => {
    const employerIds = [...new Set(jobs.map(([_, job]) => job.employerId))];
    const fetchEmployerDetails = async () => {
      let details = {};
      for (const id of employerIds) {
        const empRef = ref(db, `users/${id}`);
        const snapshot = await get(empRef);
        if (snapshot.exists()) {
          details[id] = snapshot.val().businessName || "Unknown Business";
        }
      }
      setEmployerDetails(details);
    };

    if (employerIds.length > 0) {
      fetchEmployerDetails();
    }
  }, [jobs]);

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleRequestJob = async (jobId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const jobRef = ref(db, `jobs/${jobId}`);
    const requestRef = ref(db, `jobs/${jobId}/requests/${userId}`);
    const freelancerRef = ref(db, `users/${userId}`);

    try {
      const freelancerData = (await get(freelancerRef)).val();
      const freelancerName = `${freelancerData.firstname} ${freelancerData.lastname}`;

      await set(requestRef, {
        status: "requested",
        freelancerId: userId,
        freelancerName,
      });

      const jobData = (await get(jobRef)).val();
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
        {filteredJobs.length > 0 ? (
          filteredJobs.map(([id, job]) => {
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
