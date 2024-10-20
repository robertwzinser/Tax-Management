import { useState, useEffect } from "react";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import { auth } from "../firebase";
import "./Deductions.css";

const Deductions = () => {
  const [deductions, setDeductions] = useState([{ category: "", amount: "" }]); // Default amount as an empty string
  const [taxRate, setTaxRate] = useState(""); // Default tax rate as an empty string
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [taxBurdenReduction, setTaxBurdenReduction] = useState(0);

  // Add a new empty deduction field
  const addDeductionField = () => {
    setDeductions([...deductions, { category: "", amount: "" }]); // Default amount as empty
  };

  // Remove a specific deduction field
  const removeDeductionField = (index) => {
    const newDeductions = [...deductions];
    newDeductions.splice(index, 1);
    setDeductions(newDeductions);
  };

  // Handle input changes for custom deductions
  const handleDeductionChange = (index, event) => {
    const { name, value } = event.target;
    const newDeductions = [...deductions];
    newDeductions[index][name] = name === "amount" ? parseFloat(value) || "" : value; // Set empty string for the default
    setDeductions(newDeductions);
  };

  // Handle tax rate input
  const handleTaxRateChange = (e) => {
    setTaxRate(parseFloat(e.target.value) || ""); // Set empty string for default
  };

  // Calculate total deductions and tax burden reduction whenever inputs change
  useEffect(() => {
    const total = deductions.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    setTotalDeductions(total);
    setTaxBurdenReduction(total * (parseFloat(taxRate) / 100)); // Apply tax rate as a percentage
  }, [deductions, taxRate]);

  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user?.uid && taxRate > 0) {
      try {
        const deductionRef = ref(getDatabase(), "deductionCollection");
        const newDeduction = push(deductionRef);
        await set(newDeduction, {
          deductions,
          totalDeductions,
          taxRate,
          timestamp: serverTimestamp(),
          userID: user.uid,
        });
        // Reset state after submission
        setDeductions([{ category: "", amount: "" }]);
        setTaxRate("");
      } catch (error) {
        console.log(error);
      }
    } else {
      alert("Please input a valid tax rate.");
    }
  };

  return (
    <div className="deductions-container">
      <h1>Deductions</h1>
      <form className="deduction-form" onSubmit={formSubmit}>
        {/* Tax Rate Input */}
        <div className="deduction-input">
          <label>
            Tax Rate (%):
            <input
              type="number"
              value={taxRate}
              onChange={handleTaxRateChange}
              placeholder="Enter your tax rate"
              required
            />
          </label>
        </div>

        {/* Dynamic Deduction Fields */}
        {deductions.map((deduction, index) => (
          <div className="deduction-input" key={index}>
            <label>
              Deduction Category:
              <input
                type="text"
                name="category"
                value={deduction.category}
                onChange={(event) => handleDeductionChange(index, event)}
                placeholder="Enter deduction category"
                required
              />
            </label>
            <label>
              Deduction Amount:
              <input
                type="number"
                name="amount"
                value={deduction.amount}
                onChange={(event) => handleDeductionChange(index, event)}
                placeholder="Input the corresponding amount"
                required
              />
            </label>
            <button type="button" onClick={() => removeDeductionField(index)}>
              Remove
            </button>
          </div>
        ))}

        <button type="button" onClick={addDeductionField} className="add-button">
          Add Deduction Category
        </button>

        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>

      {/* Display total deductions and tax reduction */}
      <div className="deduction-summary">
        <h2>Total Deductions: ${totalDeductions.toFixed(2)}</h2>
        <h2>Tax Burden Reduction: ${taxBurdenReduction.toFixed(2)}</h2>
      </div>
    </div>
  );
};

export default Deductions;
