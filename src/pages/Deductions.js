import { useState, useEffect } from "react";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import { auth } from "../firebase";
import "./Deductions.css";

const Deductions = () => {
  const [inputs, setInputs] = useState([{ category: "", deduction: 0 }]);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [taxBurdenReduction, setTaxBurdenReduction] = useState(0); // State to track tax burden reduction
  const taxRate = 0.25; // Estimated tax rate (25%)

  const addInput = () => {
    setInputs([...inputs, { category: "", deduction: 0 }]);
  };

  const removeInputs = (currentIndex) => {
    const filteredInputs = inputs.filter((input, index) => index !== currentIndex);
    setInputs(filteredInputs);
  };

  const handleChange = (e, index) => {
    const inputData = [...inputs];
    inputData[index][e.target.name] = e.target.value;
    setInputs(inputData);
  };

  // Calculate total deductions and tax burden reduction whenever inputs change
  useEffect(() => {
    const total = inputs.reduce((acc, input) => acc + parseFloat(input.deduction || 0), 0);
    setTotalDeductions(total);

    // Calculate the tax burden reduction
    const reduction = total * taxRate;
    setTaxBurdenReduction(reduction);
  }, [inputs]);

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user.uid) {
      inputs.map(async (input) => {
        try {
          const deductionRef = ref(getDatabase(), "deductionCollection");
          const newDeduction = push(deductionRef);
          await set(newDeduction, {
            category: input.category,
            deduction: input.deduction,
            timestamp: serverTimestamp(),
            userID: user.uid,
          });
          setInputs([{ category: "", deduction: 0 }]); // Reset inputs after submission
        } catch (error) {
          console.log(error);
        }
      });
    }
  };

  return (
    <div className="deductions-container">
      <h1>Deductions</h1>
      <div className="deductions-content">
        <form className="deduction-form" onSubmit={(e) => formSubmit(e)}>
          {inputs.map((input, index) => (
            <div key={index} className="deduction-item">
              <label htmlFor="category">Category:</label>
              <select
                value={input.category}
                name="category"
                onChange={(e) => handleChange(e, index)}
              >
                <option value="">-- Select Category --</option>
                <option value="Business use of your car">Business use of your car</option>
                <option value="Business use of your home">Business use of your home</option>
                <option value="Money you put in an IRA">Money you put in an IRA</option>
                <option value="Money you put in health savings accounts">
                  Money you put in health savings accounts
                </option>
                <option value="Penalties on early withdrawals from savings">
                  Penalties on early withdrawals from savings
                </option>
                <option value="Student loan interest">Student loan interest</option>
                <option value="Teacher expenses">Teacher expenses</option>
              </select>

              <label htmlFor="deduction">Deduction:</label>
              <input
                type="number"
                placeholder="Enter deduction"
                value={input.deduction}
                name="deduction"
                onChange={(e) => handleChange(e, index)}
              />

              {inputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInputs(index)}
                  className="remove-button"
                >
                  Remove Deduction
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addInput} className="add-button">
            Add New Deduction
          </button>
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
