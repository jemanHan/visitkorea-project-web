import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles.css'
import Home from './pages/Home'
import DetailPage from './pages/DetailPage'
import MyPage from './pages/MyPage'
import SchedulePage from './pages/SchedulePage'
import TogetherPage from './pages/TogetherPage'
import NearbyRecommendationsPage from './pages/NearbyRecommendationsPage'
import Signup from './pages/Signup'
import Login from './pages/Login'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/places/:id', element: <DetailPage /> },
  { path: '/mypage', element: <MyPage /> },
  { path: '/schedule', element: <SchedulePage /> },
  { path: '/together', element: <TogetherPage /> },
  { path: '/nearby-recommendations', element: <NearbyRecommendationsPage /> },
  { path: '/signup', element: <Signup /> },
  { path: '/login', element: <Login /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)




