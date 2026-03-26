import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './dark-mode.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(BrowserRouter, null, React.createElement(App))
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {})
  })
}