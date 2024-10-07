import { useState } from "react";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import {auth, db } from "../firebase";
const Expenses = () => {
  const [category, setCategory] = useState("")
  const [inputs, setinputs] = useState([{category: "", expense: 0}])
  const addinput = ()=>{
    setinputs([...inputs, {category: "", expense: 0}])
  }
  const removeinputs = (currentindex)=>{
    const filterinputs = inputs.filter ((input, index)=> index !== currentindex)
    setinputs(filterinputs)
  } 
  const HandleChange = (e, index)=>{
    const inputdata = [...inputs]
    inputdata [index][ e.target.name]=e.target.value
    setinputs (inputdata)
  }
  const formsubmit = async (e) => {
    e.preventDefault()
    const user = auth.currentUser
    if (user.uid){
      inputs.map(async(input)=>{
        console.log(input)
        try {
          // if (input.category==="")
          //   return
          const expenseref = ref (db, "expenseCollection")
          const newexpense = push (expenseref)
        await set(newexpense, {
        category: input.category,
        expense: input.expense,
        date: serverTimestamp(), 
        userID: user.uid
        })
        setinputs([{category: "", expense: 0}])
        }
        catch (error){
          console.log("Test")
      console.log(error)
        }
      }
      )}
    }

 

  
 return (
  <div>
   <form onSubmit={(e) => formsubmit (e)}>
    {inputs.map((input,index)=>(
      <div>
 <label>Category:</label>
 <select value = {input.category} name = "category" onChange={(e)=>HandleChange(e, index)}> 
   <option value = {""}> Select an option </option>
   <option value = {"Travel"}>Travel </option>
   <option value = {"Lodging"}>Lodging </option>
   <option value = {"Food"}>Food </option>
   <option value = {"PPE"}>PPE </option>
   <option value = {"Tools"}>Tools </option>
   <option value = {"Advertising"}>Advertising </option>
   <option value = {"Utilities"}>Utilities </option>
   <option value = {"Miscellanius"}>Miscellanius </option>
   <option value = {"Subscription"}>Subscription </option>
   <option value = {"Data/Security Software"}>Data/Security Software </option>

   
 </select>
 <label>Expense:</label>
<input type = "number" placeholder="Choose your expense" value = {input.expense} name = "expense" onChange={(e)=>HandleChange(e, index)}></input>
{inputs.length > 1 && <button type= "button" onClick={()=> removeinputs(index)}>Remove Expense</button>}

</div>
    ))}
   <button type= "button" onClick={addinput}>Add New Expense </button>
  <button type= "submit" >Submit</button>
   </form>

  </div>
 ) 
}
export default Expenses