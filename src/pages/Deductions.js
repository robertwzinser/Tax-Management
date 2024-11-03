import { useState, useEffect } from "react";
import {
  getDatabase,
  ref,
  push,
  set,
  serverTimestamp,
  onValue,
  update,
} from "firebase/database";
import { auth } from "../firebase";
import "./Deductions.css";

const Deductions = () => {
  const [deduction, setDeduction] = useState({ category: "", amount: "" }); // Only one deduction at a time
  const [userDeductions, setUserDeductions] = useState([]); // Store submitted deductions
  const [editingIndex, setEditingIndex] = useState(null); // Track which deduction is being edited
  const [taxRate, setTaxRate] = useState("");
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [taxBurdenReduction, setTaxBurdenReduction] = useState(0);

  // Fetch deductions for the logged-in user on component load
  useEffect(() => {
    const fetchDeductions = async () => {
      const user = auth.currentUser;
      if (user?.uid) {
        const db = getDatabase();
        const userDeductionRef = ref(db, `deductionCollection/${user.uid}`);
        onValue(userDeductionRef, (snapshot) => {
          const fetchedDeductions = snapshot.val();
          if (fetchedDeductions) {
            const deductionsArray = Object.entries(fetchedDeductions).map(
              ([id, data]) => ({
                id,
                ...data,
              })
            );
            setUserDeductions(deductionsArray);

            // Calculate total and tax burden with all submitted deductions
            const total = deductionsArray.reduce(
              (acc, curr) => acc + (parseFloat(curr.totalDeductions) || 0),
              0
            );
            setTotalDeductions(total);

            // Calculate the tax burden reduction based on the tax rate from the last submission
            const latestTaxRate =
              deductionsArray.length > 0
                ? deductionsArray[deductionsArray.length - 1].taxRate
                : 0;
            const taxRateParsed = parseFloat(latestTaxRate) || 0;
            setTaxBurdenReduction(total * (taxRateParsed / 100));
          }
        });
      }
    };

    fetchDeductions();
  }, []);

  // Handle input changes for the single deduction field
  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setDeduction((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  // Handle tax rate input
  const handleTaxRateChange = (e) => {
    setTaxRate(parseFloat(e.target.value) || "");
  };

  // Submit new or edited deduction
  const formSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user?.uid && taxRate > 0) {
      try {
        const db = getDatabase();
        const deductionRef = ref(db, `deductionCollection/${user.uid}`);
        const newDeduction = push(deductionRef);

        if (editingIndex !== null) {
          const updatedDeduction = {
            deductions: [deduction],
            totalDeductions: deduction.amount,
            taxRate, // Store the tax rate for each deduction
            timestamp: serverTimestamp(),
          };
          await update(
            ref(
              db,
              `deductionCollection/${user.uid}/${userDeductions[editingIndex].id}`
            ),
            updatedDeduction
          );
          setEditingIndex(null); // Reset after editing
        } else {
          await set(newDeduction, {
            deductions: [deduction],
            totalDeductions: deduction.amount,
            taxRate, // Store the tax rate for the deduction
            timestamp: serverTimestamp(),
          });
        }

        // Reset state after submission
        setDeduction({ category: "", amount: "" });
        setTaxRate("");
      } catch (error) {
        console.log(error);
      }
    } else {
      alert("Please input a valid tax rate.");
    }
  };

  // Edit an existing deduction
  const editDeduction = (index) => {
    const deductionToEdit = userDeductions[index].deductions[0];
    setDeduction(deductionToEdit);
    setTaxRate(userDeductions[index].taxRate); // Set the tax rate from the selected deduction
    setEditingIndex(index); // Set index for editing
  };

  return (
    <div className="deductions-container">
      <h1>Deductions Management</h1>
      <form className="deduction-form" onSubmit={formSubmit}>
        <div className="deduction-input">
          <label>Tax Rate (%):</label>
          <input
            type="number"
            value={taxRate}
            onChange={handleTaxRateChange}
            placeholder="Enter your tax rate"
            required
          />
        </div>

        <div className="deduction-input">
          <label>Deduction Category:</label>
          <input
            type="text"
            name="category"
            value={deduction.category}
            onChange={handleDeductionChange}
            placeholder="Enter deduction category"
            required
          />
          <label>Deduction Amount:</label>
          <input
            type="number"
            name="amount"
            value={deduction.amount}
            onChange={handleDeductionChange}
            placeholder="Input the corresponding amount"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          {editingIndex !== null ? "Update Deduction" : "Submit Deduction"}
        </button>
      </form>

      <div className="deduction-summary">
        <h2>Total Deductions: ${totalDeductions.toFixed(2)}</h2>
        <h2>Tax Burden Reduction: ${taxBurdenReduction.toFixed(2)}</h2>
      </div>

      {/* Submitted deductions list with tax rate displayed */}
      <div className="submitted-deductions">
        <h2>Submitted Deductions:</h2>
        {userDeductions.length > 0 ? (
          <ul>
            {userDeductions.map((ded, index) => (
              <li key={ded.id}>
                <div>
                  <strong>Category:</strong> {ded.deductions[0].category} |{" "}
                  <strong>Amount:</strong> ${ded.deductions[0].amount} |{" "}
                  <strong>Tax Rate:</strong> {ded.taxRate}%
                </div>
                <button onClick={() => editDeduction(index)}>Edit</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No deductions submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default Deductions;
