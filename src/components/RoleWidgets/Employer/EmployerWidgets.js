import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db, auth } from "../../../firebase";
import { Link } from "react-router-dom";
import "./EmployerWidgets.css";

export const EmployerWidgets = () => {
  const [freelancers, setFreelancers] = useState([]);

  // Fetch freelancers working for the employer
  useEffect(() => {
    const employerId = auth.currentUser?.uid;
    const freelancersRef = ref(db, `users`);
    onValue(freelancersRef, (snapshot) => {
      const data = snapshot.val();
      const freelancersList = [];
      for (const id in data) {
        if (
          data[id].role === "Freelancer" &&
          data[id].linkedEmployers?.[employerId]
        ) {
          freelancersList.push({
            id,
            fullname: `${data[id].firstname} ${data[id].lastname}`,
            email: data[id].email,
          });
        }
      }
      setFreelancers(freelancersList);
    });
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
