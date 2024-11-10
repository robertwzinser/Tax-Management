import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import "./TaxSummary.css";

const TaxSummary = () => {
  const [userRole, setUserRole] = useState("");
  const [employers, setEmployers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState("");
  const [incomeData, setIncomeData] = useState([]);
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    address: "",
    profession: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;

        const userRef = ref(db, "users/" + userId);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setProfileData({
              firstname: data.firstname || "",
              lastname: data.lastname || "",
              address: data.address || "",
              profession: data.profession || "",
              email: user.email,
            });
            setUserRole(data.role);
          }
          setLoading(false);
        });

        if (userRole === "Freelancer") {
          const linkedEmployersRef = ref(db, `users/${userId}/linkedEmployers`);
          onValue(linkedEmployersRef, (snapshot) => {
            console.log("Employers Data:", employers);
            const data = snapshot.val();
            if (data) {
              const employersData = Object.entries(data).map(
                ([id, employer]) => ({
                  id,
                  businessName: employer.name,
                })
              );
              setEmployers(employersData);
            }
          });
        }
      } else {
        setUserRole("");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userRole]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (selectedEmployer && userId) {
      const incomeRef = ref(
        db,
        `users/${userId}/linkedEmployers/${selectedEmployer}/incomeEntries`
      );
      onValue(incomeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const incomeEntries = Object.values(data);
          setIncomeData(incomeEntries);
        } else {
          setIncomeData([]);
        }
      });
    }
  }, [selectedEmployer]);

  const handleEmployerChange = (e) => {
    setSelectedEmployer(e.target.value);
  };

  const handleGenerateCombined = async () => {
    const userId = auth.currentUser?.uid;

    if (employers.length === 0) {
      alert("No employers linked to this freelancer.");
      return;
    }

    let fetchPromises = [];

    // Create a promise for each employer's income data fetch
    employers.forEach((employer) => {
      const incomeRef = ref(
        db,
        `users/${userId}/linkedEmployers/${employer.id}/incomeEntries`
      );

      let promise = new Promise((resolve, reject) => {
        onValue(
          incomeRef,
          (snapshot) => {
            const data = snapshot.val();
            if (data) {
              resolve(Object.values(data)); // Resolve with the income entries
            } else {
              resolve([]); // Resolve with an empty array if no data
            }
          },
          (error) => {
            reject(error); // Reject the promise if there's an error
          }
        );
      });

      fetchPromises.push(promise);
    });

    try {
      // Wait for all promises to resolve
      let allIncomeData = (await Promise.all(fetchPromises)).flat(); // Combine all entries into one array

      if (allIncomeData.length > 0) {
        generatePDF(allIncomeData, "Combined Tax Summary");
      } else {
        alert("No income data available across employers.");
      }
    } catch (error) {
      console.error("Failed to fetch income data:", error);
      alert("An error occurred while fetching income data.");
    }
  };

  // Helper function to generate PDF for selected employer or combined
  const generatePDF = (incomeEntries, title) => {
    const doc = new jsPDF("p", "pt");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Section
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 40, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      pageWidth - 15,
      20,
      { align: "right" }
    );

    // Profile Information
    doc.setFontSize(14);
    doc.text("Freelancer Information", 40, 80);
    doc.setFontSize(12);
    doc.text(`Name: ${profileData.firstname} ${profileData.lastname}`, 40, 100);
    doc.text(`Address: ${profileData.address}`, 40, 120);
    doc.text(`Profession: ${profileData.profession}`, 40, 140);

    // Income and Tax Details Table
    const startY = 200;
    doc.setFont("helvetica", "bold");
    doc.text("Income and Tax Details", 40, startY);
    doc.setLineWidth(1);
    doc.line(40, startY + 5, pageWidth - 40, startY + 5);

    // Table Headers
    const tableHeaders = [
      "Service",
      "Income Amount",
      "Estimated Tax",
      "Entry Date",
    ];
    const headerY = startY + 30;
    let rowY = headerY + 20;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    tableHeaders.forEach((header, index) => {
      const xPos = 40 + (index * (pageWidth - 80)) / tableHeaders.length;
      doc.text(header, xPos, headerY);
    });

    let totalIncome = 0;
    let totalEstimatedTax = 0;

    doc.setFont("helvetica", "normal");
    incomeEntries.forEach((entry, rowIndex) => {
      const cells = [
        entry.service,
        `$${entry.amount.toFixed(2)}`,
        `$${entry.estimatedTax ? entry.estimatedTax.toFixed(2) : "N/A"}`,
        entry.date,
      ];

      cells.forEach((cell, cellIndex) => {
        const xPos = 40 + (cellIndex * (pageWidth - 80)) / cells.length;
        doc.text(cell.toString(), xPos, rowY);
      });

      // Add to totals
      totalIncome += entry.amount;
      if (entry.estimatedTax) {
        totalEstimatedTax += entry.estimatedTax;
      }

      rowY += 20;
      if (rowY > doc.internal.pageSize.getHeight() - 100) {
        // Add new page if content overflows
        doc.addPage();
        rowY = 60;
      }
    });

    // Draw a bottom line to separate totals
    const dividerY = rowY + 40;
    doc.setLineWidth(1);
    doc.line(40, dividerY, pageWidth - 40, dividerY);

    // Display total income and estimated tax below the line
    const totalSectionY = dividerY + 20;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 40, totalSectionY);
    doc.text(
      `Total Estimated Tax: $${totalEstimatedTax.toFixed(2)}`,
      40,
      totalSectionY + 20
    );

    // Footer Section
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This document is generated as a summary of tax-related information and is not a formal tax document.",
      40,
      doc.internal.pageSize.getHeight() - 30
    );

    // Save the PDF
    doc.save(`${title}.pdf`);
  };

  const handleGenerate = () => {
    if (incomeData.length === 0) {
      alert("No tax data available for the selected employer.");
      return;
    }

    generatePDF(
      incomeData,
      `Tax Summary for ${
        employers.find((employer) => employer.id === selectedEmployer)
          ?.businessName
      }`
    );
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <div className="generate-tax-summary-container">
      <h1>Generate Tax Summary</h1>
      <div className="generate-tax-summary-info">
        <p>
          Name: {profileData.firstname} {profileData.lastname}
        </p>
        <p>Address: {profileData.address}</p>
        <p>Profession: {profileData.profession}</p>
      </div>

      {userRole === "Freelancer" && employers.length > 0 && (
        <>
          <div className="employer-select-container">
            <label htmlFor="employer-select">Select Employer:</label>
            <select
              id="employer-select"
              value={selectedEmployer}
              onChange={handleEmployerChange}
            >
              <option value="">-- Select an Employer --</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>
                  {employer.businessName}
                </option>
              ))}
            </select>
          </div>
          {selectedEmployer && (
            <div className="generate-tax-summary-details">
              <h2>
                Tax Details for{" "}
                {
                  employers.find((employer) => employer.id === selectedEmployer)
                    ?.businessName
                }
              </h2>
              {incomeData.length === 0 ? (
                <p>No tax data for the selected employer.</p>
              ) : (
                <div className="tax-summary-preview">
                  <table className="tax-summary-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Income Amount</th>
                        <th>Estimated Tax</th>
                        <th>Entry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeData.map((income, index) => (
                        <tr key={index}>
                          <td>{income.service}</td>
                          <td>${income.amount.toFixed(2)}</td>
                          <td>
                            $
                            {income.estimatedTax
                              ? income.estimatedTax.toFixed(2)
                              : "N/A"}
                          </td>
                          <td>{income.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="total-summary">
                    <p>
                      <strong>Total Income: </strong>$
                      {incomeData
                        .reduce((total, income) => total + income.amount, 0)
                        .toFixed(2)}
                    </p>
                    <p>
                      <strong>Total Estimated Tax: </strong>$
                      {incomeData
                        .reduce(
                          (total, income) => total + (income.estimatedTax || 0),
                          0
                        )
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate combined summary button */}
          <button
            onClick={handleGenerate}
            className="generate-button"
            disabled={!selectedEmployer}
          >
            Generate for Selected Business
          </button>
          <button
            onClick={handleGenerateCombined}
            className="generate-button-combined"
          >
            Generate Combined Summary
          </button>
        </>
      )}
    </div>
  );
};

export default TaxSummary;
