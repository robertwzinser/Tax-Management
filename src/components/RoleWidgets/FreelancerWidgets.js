import { Link } from "react-router-dom"; 

export const FreelancerWidgets = ({ taxData, incomeData }) => {
    return (
      <>
        <div className="widget">
          <h2>Tax Summary</h2>
          <p>Estimated Taxes: ${taxData.estimatedTaxes || "N/A"}</p>
          <p>Total Income: ${taxData.totalIncome || "N/A"}</p>
        </div>
        <div className="widget">
          <h2>Income Over Time</h2>
          <canvas id="incomeChart"></canvas>
        </div>
        <div className="widget">
          <h2>Add Daily Income</h2>
          <Link to="/daily-income" className="dashboard-btn">
            Add Income
          </Link>
        </div>
      </>
    );
  };