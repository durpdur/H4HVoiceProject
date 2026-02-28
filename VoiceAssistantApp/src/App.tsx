import { useState, useEffect } from 'react'
import FunctionInterface from './components/FunctionInterface/FunctionInterface'
import type { FunctionDescriptor } from './types/FunctionDescriptor'
import { Button } from '@mui/material'

function App() {
  const [functions, setFunctions] = useState<FunctionDescriptor[]>([])

  // Adds two mockFunctions to function state
  useEffect(() => {
    const mockFunction: FunctionDescriptor = {
      function_id: "kettle_on_001",
      function_desc: "Turns on the smart kettle, optionally for a specified duration in minutes.",
      regex_phrases: [
        "turn on (the )?kettle",
        "start (the )?kettle",
        "boil water"
      ],
      logic:
        "if (slots.duration) { device.kettle.turn_on({ duration: slots.duration }); } else { device.kettle.turn_on(); }",
      response_phrase: "Kettle has been turned on",
      slots: { duration: "(\\d+)\\s+minutes" },
      metadata: { confidence_score: 0.95, usage_count: 12 },
    }
    const mockFunction2: FunctionDescriptor = {
      function_id: "kettle_off_001",
      function_desc: "Turns off the smart kettle immediately or cancels a scheduled heating cycle.",
      regex_phrases: [
        "turn off (the )?kettle",
        "stop (the )?kettle",
        "cancel (the )?kettle"
      ],
      logic: "device.kettle.turn_off();",
      response_phrase: "Kettle has been turned off",
      slots: {},
      metadata: { confidence_score: 0.93, usage_count: 7 },
    }

    setFunctions([mockFunction, mockFunction2])
  }, [])

  // FUNCTION
  // Updates the function state
  const updateFunction = (index: number, updated: FunctionDescriptor) => {
    setFunctions(prev => prev.map((f, i) => (i === index ? updated : f)))
  }

  // prints function
  const printFunction = () => {
    functions.map(func => console.log(func.response_phrase));
  }

  return (
    <div style={{ padding: 16 }}>
      {functions.map((func, idx) => (
        <FunctionInterface
          key={func.function_id}
          functionData={func}
          onChange={(updated) => updateFunction(idx, updated)}
        />
      ))}

      <Button onClick={printFunction}>Check State</Button>
    </div>
  )
}

export default App