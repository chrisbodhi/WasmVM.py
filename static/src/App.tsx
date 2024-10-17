import { MouseEventHandler, useEffect, useState } from 'react'
import './App.css'


function App() {
  const [instructions, setInstructions] = useState([])
  const [toSend, setToSend] = useState<string[]>([])
  const [vmId, setVmId] = useState('')
  const [stack, setStack] = useState([])

  useEffect(() => {
    getOrSetVM()
  })

  function getOrSetVM() {
    // read from localStorage to get the vmId
    const vmId = localStorage.getItem('vmId')
    if (vmId) {
      setVmId(vmId)
    } else {
      getVM()
    }
  }

  function getVM() {
    fetch('http://localhost:8000/create', {
      method: 'POST'
    })
      .then(res => res.json())
      .then(json => {
        const [, vmId] = json
        setVmId(vmId)
        localStorage.setItem('vmId', vmId)
        setStack([])
      })
  }

  const fetchInstructions = async () => {
    const res = await fetch('http://localhost:8000/instructions')
    const json = await res.json()
    setInstructions(json.instructions)
  }

  const addInstruction: MouseEventHandler = (e) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    setToSend([...toSend, target.innerText])
  }

  const sendInstructions = async () => {
    const resSend = await fetch(`http://localhost:8000/instructions/${vmId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toSend.map(i => ({ name: i, value: i === "push" ? 17 : undefined, type: "i32" })))
    })
    const jsonSend = await resSend.json()
    console.log("stack after send", jsonSend)
    setToSend([])

    const resRun = await fetch(`http://localhost:8000/run/${vmId}`, {
      method: 'POST'
    })
    const jsonRun = await resRun.json()
    console.log("stack after run", jsonRun)
    setStack(jsonRun)
  }


  return (
    <>
      <h1>wasmvm.py</h1>
      <div>
        {instructions.length === 0 && <button onClick={fetchInstructions}>
          Get instructions
        </button>}
        <button onClick={getVM}>Get a new VM</button>
      </div>
      <div style={{ display: "flex" }}>
        <div className="card">
          <ul>
            {instructions.map((instruction, index) => (
              <li key={index+instruction} style={{ listStyle: "none", margin: "0.5rem" }}>
                <button onClick={addInstruction}>{instruction}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>Instructions to send</h2>
          <ul style={{ display: "flex", flexDirection: "column-reverse" }}>
            {toSend.map((instruction, index) => (
              <li key={index+instruction}>{instruction}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <button onClick={sendInstructions}>
            <big>
              Send instructions
            </big>
          </button>
        </div>
        <div className="card">
          <h2>Stack</h2>
          <ul style={{ display: "flex", flexDirection: "column-reverse"}}>
            {stack.map((value, index) => (
              <li key={index+value}>{value}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

export default App
