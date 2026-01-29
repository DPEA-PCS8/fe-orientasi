import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  const fetchHello = async () => {
    try {
      const response = await fetch('https://test-orientasi-spring-test-orientasi.apps.ocp.ojk.go.id/api/hello')
      const data = await response.json()
      // The user specified the response format: { status: 200, message: "Success", data: "Hello, World!" }
      // We want to display just "Hello, World!" which is in the data field.
      if (data && data.data) {
        setMessage(data.data)
      } else {
        setMessage('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage('Error fetching data')
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={fetchHello} style={{ marginLeft: '10px' }}>
          Hit Backend
        </button>
        <p>
          PesenKopi??
        </p>
      </div>
      {message && (
        <div className="card">
          <h2>Response from Backend:</h2>
          <p>{message}</p>
        </div>
      )}
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
