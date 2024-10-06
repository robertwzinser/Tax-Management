import { useState } from "react";
const Expenses = () => {
  const [category, setCategory] = useState("")
  const [inputs, setinputs] = useState([{category: "", expense: "0"}])
  const addinput = ()=>{
    setinputs([...inputs, {category: "", expense: "0"}])
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
 return (
  <div>
   <form >
    {inputs.map((input,index)=>(
      <div>
 <label>Category:</label>
 <select value = {input.category} name = "category" onChange={(e)=>HandleChange(e, index)}> 
   <option value = {"Option1"}>Travel </option>
   <option value = {"Option2"}>Lodging </option>
   <option value = {"Option3"}>Food </option>
   <option value = {"Option4"}>PPE </option>
   <option value = {"Option5"}>Tools </option>
   <option value = {"Option6"}>Advertising </option>
     <option value = {"Option8"}>Utilities </option>
   <option value = {"Option9"}>Miscellanius </option>
   <option value = {"Option10"}>Subscription </option>
   <option value = {"Option11"}>Data/Security Software </option>

   
 </select>
 <label>Expense:</label>
<input type = "number" placeholder="Choose your expense"name = "expense" onChange={(e)=>HandleChange(e, index)}></input>
{inputs.length > 1 && <button type= "button" onClick={()=> removeinputs(index)}>Remove Expense</button>}

</div>
    ))}
   <button type= "button" onClick={addinput}>Add New Expense </button>
  <button type= "submit">Submit</button>
   </form>

  </div>
 ) 
}
export default Expenses