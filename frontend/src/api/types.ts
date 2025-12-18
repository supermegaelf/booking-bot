export interface Service {
  id: number
  name: string
  category: string | null
  description: string | null
  price: string
  duration_minutes: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface Master {
  id: number
  name: string
  specialization: string | null
  phone: string | null
  telegram_id: number | null
  photo_url: string | null
  work_schedule: Record<string, any> | null
  rating: string | null
  reviews_count: number
  services: Service[]
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled"

export interface Booking {
  id: number
  user_id: number
  service_id: number
  master_id: number | null
  booking_date: string
  booking_time: string
  status: BookingStatus
  comment: string | null
  certificate_id: number | null
  service: Service
  master: Master | null
  created_at: string
  updated_at: string | null
}

export interface Certificate {
  id: number
  code: string
  amount: string
  category: string | null
  description: Record<string, any> | null
  image_url: string | null
  user_id: number | null
  purchased_by_user_id: number | null
  is_used: boolean
  used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Promotion {
  id: number
  title: string
  description: string | null
  discount_percent: string
  image_url: string | null
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Review {
  id: number
  master_id: number
  user_id: number
  booking_id: number | null
  rating: number
  comment: string | null
  created_at: string
  updated_at: string | null
}

export interface SalonSettings {
  id: number
  working_hours: Record<string, any> | null
  address: string | null
  phone: string | null
  email: string | null
  social_links: Record<string, any> | null
  map_coordinates: string | null
  privacy_policy_text: string | null
  created_at: string
  updated_at: string | null
}

export interface User {
  id: number
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  is_admin: boolean
  created_at: string
  updated_at: string | null
}

export interface AvailableTimeSlot {
  time: string
  available: boolean
  master_id: number | null
  master_name: string | null
}

export interface AvailableSlotsResponse {
  date: string
  slots: AvailableTimeSlot[]
}

export interface BookingCreate {
  service_id: number
  master_id?: number | null
  booking_date: string
  booking_time: string
  comment?: string | null
  certificate_id?: number | null
}

export interface ReviewCreate {
  master_id: number
  booking_id?: number | null
  rating: number
  comment?: string | null
}

export interface UserUpdate {
  phone?: string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}
