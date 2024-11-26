import React, { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db, auth } from "../../../firebase";
import { Link } from "react-router-dom";
import "./EmployerWidgets.css";

export const EmployerWidgets = () => {
  const [freelancers, setFreelancers] = useState([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      const employerId = auth.currentUser?.uid;
      if (!employerId) return;

      // Fetch employer's data to access blockedUsers
      const employerRef = ref(db, `users/${employerId}`);
      const employerSnapshot = await get(employerRef);

      if (!employerSnapshot.exists()) return;

      const employerData = employerSnapshot.val();
      const employerBlockedUsers = employerData.blockedUsers || {}; // Get blocked users by the employer

      // Fetch all users to find freelancers
      const freelancersRef = ref(db, `users`);
      const freelancersSnapshot = await get(freelancersRef);

      if (freelancersSnapshot.exists()) {
        const allUsers = freelancersSnapshot.val();
        const filteredFreelancers = [];

        for (const freelancerId in allUsers) {
          const freelancer = allUsers[freelancerId];

          // Check if the freelancer is linked to the employer
          const isLinked = freelancer.linkedEmployers?.[employerId];

          // Check if the employer has blocked the freelancer
          const isBlockedByEmployer = employerBlockedUsers[freelancerId]?.blocked;

          // Check if the freelancer has blocked the employer
          const hasBlockedEmployer = freelancer.blockedUsers?.[employerId]?.blocked;

          // Exclude freelancers if blocked by either side
          if (
            freelancer.role === "Freelancer" &&
            isLinked &&
            !(isBlockedByEmployer || hasBlockedEmployer) // Check block conditions
          ) {
            filteredFreelancers.push({
              id: freelancerId,
              fullname: `${freelancer.firstname} ${freelancer.lastname}`,
              email: freelancer.email,
            });
          }
        }

        setFreelancers(filteredFreelancers);
      }
    };

    fetchFreelancers();
  }, []);

  return (
    <div className="employer-widgets-container">
      <div className="header">
        <h1>Your Freelancers</h1>
      </div>

      {freelancers.length === 0 ? (
        <p className="no-freelancers">
          No freelancers working for you currently.
        </p>
      ) : (
        <div className="freelancer-grid">
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className="freelancer-card">
              <h1>{freelancer.fullname}</h1>
              <p className="freelancer-email">{freelancer.email}</p>
              <Link
                to={`/freelancer/${freelancer.id}`}
                className="dashboard-btn"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
