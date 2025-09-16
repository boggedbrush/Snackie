import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Landing from './pages/Landing'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import SharedResults from './pages/SharedResults'

  const router = createBrowserRouter([
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Landing /> },
      { path: 'quiz', element: <Quiz /> },
      { path: 'results/:sessionId', element: <Results /> },
      { path: 's/:sessionId', element: <SharedResults /> },
      ],
    },
  ])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>
)
