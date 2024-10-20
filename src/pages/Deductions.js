import { useState, useEffect } from "react";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import { auth } from "../firebase";
import "./Deductions.css";

const Deductions = () => {
  const [selectedDeductions, setSelectedDeductions] = useState({
    carUse: false,
    homeUse: false,
    iraAmount: 0,
    healthSavings: 0,
    earlyWithdrawalPenalties: 0,
    studentLoanInterest: 0,
    teacherExpenses: 0,
  });
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [taxBurdenReduction, setTaxBurdenReduction] = useState(0); // State to track tax burden reduction
  const taxRate = 0.25; // Estimated tax rate (25%)

  const toggleButton = (field) => {
    setSelectedDeductions((prevState) => ({
      ...prevState,
      [field]: !prevState[field], // Toggle the selected state
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedDeductions((prevState) => ({
      ...prevState,
      [name]: parseFloat(value) || 0,
    }));
  };

  useEffect(() => {
    // Calculate total deductions and tax burden reduction
    let total = 0;

    if (selectedDeductions.carUse) {
      total += 1000; // Example value for business use of car
    }
    if (selectedDeductions.homeUse) {
      total += 1500; // Example value for business use of home
    }

    // Add quantifiable deductions
    total += selectedDeductions.iraAmount;
    total += selectedDeductions.healthSavings;
    total += selectedDeductions.earlyWithdrawalPenalties;
    total += selectedDeductions.studentLoanInterest;
    total += selectedDeductions.teacherExpenses;

    setTotalDeductions(total);
    setTaxBurdenReduction(total * taxRate);
  }, [selectedDeductions]);

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user?.uid) {
      try {
        const deductionRef = ref(getDatabase(), "deductionCollection");
        const newDeduction = push(deductionRef);
        await set(newDeduction, {
          selectedDeductions,
          totalDeductions,
          timestamp: serverTimestamp(),
          userID: user.uid,
        });
        // Reset state after submission
        setSelectedDeductions({
          carUse: false,
          homeUse: false,
          iraAmount: 0,
          healthSavings: 0,
          earlyWithdrawalPenalties: 0,
          studentLoanInterest: 0,
          teacherExpenses: 0,
        });
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="deductions-container">
      <h1>Deductions</h1>
      <div className="deductions-content">
        <form className="deduction-form" onSubmit={formSubmit}>
          {/* Button Select for Business Use of Car and Home */}
          <div className="button-group">
            <button
              type="button"
              className={`select-button ${selectedDeductions.carUse ? 'active' : ''}`}
              onClick={() => toggleButton('carUse')}
            >
              {selectedDeductions.carUse ? "Selected: Business use of car" : "Business use of car"}
            </button>

            <button
              type="button"
              className={`select-button ${selectedDeductions.homeUse ? 'active' : ''}`}
              onClick={() => toggleButton('homeUse')}
            >
              {selectedDeductions.homeUse ? "Selected: Business use of home" : "Business use of home"}
            </button>
          </div>

          {/* IRA input prompt */}
          <div className="ira-input">
            <label>
              Money you put in an IRA:
              <input
                type="number"
                name="iraAmount"
                value={selectedDeductions.iraAmount}
                onChange={handleInputChange}
                placeholder="Enter amount"
              />
            </label>
          </div>

          {/* Health Savings input */}
          <div className="deduction-input">
            <label>
              Money you put in health savings accounts:
              <input
                type="number"
                name="healthSavings"
                value={selectedDeductions.healthSavings}
                onChange={handleInputChange}
                placeholder="Enter amount"
              />
            </label>
          </div>

          {/* Early Withdrawal Penalties input */}
          <div className="deduction-input">
            <label>
              Penalties on early withdrawals from savings:
              <input
                type="number"
                name="earlyWithdrawalPenalties"
                value={selectedDeductions.earlyWithdrawalPenalties}
                onChange={handleInputChange}
                placeholder="Enter amount"
              />
            </label>
          </div>

          {/* Student Loan Interest input */}
          <div className="deduction-input">
            <label>
              Student loan interest:
              <input
                type="number"
                name="studentLoanInterest"
                value={selectedDeductions.studentLoanInterest}
                onChange={handleInputChange}
                placeholder="Enter amount"
              />
            </label>
          </div>

          {/* Teacher Expenses input */}
          <div className="deduction-input">
            <label>
              Teacher expenses:
              <input
                type="number"
                name="teacherExpenses"
                value={selectedDeductions.teacherExpenses}
                onChange={handleInputChange}
                placeholder="Enter amount"
              />
            </label>
          </div>

          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>

        {/* Display total deductions and tax reduction impact */}
        <div className="deduction-summary">
          <h2>Total Deductions: ${totalDeductions.toFixed(2)}</h2>
          <h2>Tax Burden Reduction: ${taxBurdenReduction.toFixed(2)}</h2>
        </div>
      </div>
    </div>
  );
};

export default Deductions;
