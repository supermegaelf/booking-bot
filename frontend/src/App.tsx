import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Masters from './pages/Masters'
import MasterDetail from './pages/MasterDetail'
import Booking from './pages/Booking'
import Bookings from './pages/Bookings'
import Profile from './pages/Profile'
import Certificates from './pages/Certificates'
import Promotions from './pages/Promotions'
import CreateReview from './pages/CreateReview'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/masters" element={<Masters />} />
        <Route path="/masters/:id" element={<MasterDetail />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/reviews/create" element={<CreateReview />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

