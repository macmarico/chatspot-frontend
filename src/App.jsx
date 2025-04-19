import ConnectionForm from './components/ConnectionForm'
import MessageInput from './components/MessageInput'
import ChatWindow from './components/ChatWindow'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ChatSpot Messenger</h1>
      </header>

      <main className="app-content">
        <div className="connection-section">
          <ConnectionForm />
        </div>

        <div className="messaging-section">
          <div className="message-input-container">
            <MessageInput />
          </div>

          <div className="chat-window-container">
            <ChatWindow />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>ChatSpot Messenger &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
