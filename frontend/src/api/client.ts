import axios from 'axios'
import type {
  Service,
  Master,
  Booking,
  Certificate,
  Promotion,
  Review,
  SalonSettings,
  User,
  AvailableSlotsResponse,
  BookingCreate,
  ReviewCreate,
  UserUpdate
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'Произошла ошибка при запросе'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      return Promise.reject(new Error('Нет ответа от сервера. Проверьте подключение к интернету.'))
    } else {
      return Promise.reject(new Error(error.message || 'Произошла неизвестная ошибка'))
    }
  }
)

import { getTelegramUserId } from '../utils/telegram'

const getAuthHeaders = () => {
  const telegramId = getTelegramUserId()
  if (telegramId) {
    return {
      'X-Telegram-User-Id': telegramId.toString(),
    }
  }
  return {}
}

export const servicesApi = {
  getAll: async (category?: string, isActive: boolean = true): Promise<Service[]> => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (isActive !== undefined) params.append('is_active', isActive.toString())
    
    const response = await apiClient.get<Service[]>(`/services/?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Service> => {
    const response = await apiClient.get<Service>(`/services/${id}`)
    return response.data
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/services/categories/list`)
    return response.data
  },
}

export const mastersApi = {
  getAll: async (serviceId?: number, isActive: boolean = true): Promise<Master[]> => {
    const params = new URLSearchParams()
    if (serviceId) params.append('service_id', serviceId.toString())
    if (isActive !== undefined) params.append('is_active', isActive.toString())
    
    const response = await apiClient.get<Master[]>(`/masters/?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Master> => {
    const response = await apiClient.get<Master>(`/masters/${id}`)
    return response.data
  },

  getAvailableSlots: async (
    masterId: number,
    bookingDate: string,
    serviceId: number
  ): Promise<AvailableSlotsResponse> => {
    const params = new URLSearchParams({
      booking_date: bookingDate,
      service_id: serviceId.toString(),
    })
    const response = await apiClient.get<AvailableSlotsResponse>(
      `/masters/${masterId}/available-slots?${params.toString()}`
    )
    return response.data
  },

  getAvailableSlotsForService: async (
    serviceId: number,
    bookingDate: string,
    masterId?: number
  ): Promise<AvailableSlotsResponse> => {
    const params = new URLSearchParams({
      booking_date: bookingDate,
    })
    if (masterId) params.append('master_id', masterId.toString())
    
    const response = await apiClient.get<AvailableSlotsResponse>(
      `/masters/service/${serviceId}/available-slots?${params.toString()}`
    )
    return response.data
  },
}

export const bookingsApi = {
  create: async (booking: BookingCreate): Promise<Booking> => {
    const response = await apiClient.post<Booking>('/bookings/', booking, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  getAll: async (status?: string): Promise<Booking[]> => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    
    const response = await apiClient.get<Booking[]>(`/bookings/?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  getById: async (id: number): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  cancel: async (id: number): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(`/bookings/${id}/cancel`, {}, {
      headers: getAuthHeaders(),
    })
    return response.data
  },
}

export const certificatesApi = {
  getAll: async (isUsed?: boolean): Promise<Certificate[]> => {
    const params = new URLSearchParams()
    if (isUsed !== undefined) params.append('is_used', isUsed.toString())
    
    const response = await apiClient.get<Certificate[]>(`/certificates/?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  getById: async (id: number): Promise<Certificate> => {
    const response = await apiClient.get<Certificate>(`/certificates/${id}`, {
      headers: getAuthHeaders(),
    })
    return response.data
  },
}

export const promotionsApi = {
  getAll: async (activeOnly: boolean = true): Promise<Promotion[]> => {
    const params = new URLSearchParams()
    params.append('active_only', activeOnly.toString())
    
    const response = await apiClient.get<Promotion[]>(`/promotions/?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Promotion> => {
    const response = await apiClient.get<Promotion>(`/promotions/${id}`)
    return response.data
  },
}

export const reviewsApi = {
  create: async (review: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post<Review>('/reviews/', review, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  getByMaster: async (masterId: number): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/reviews/master/${masterId}`)
    return response.data
  },
}

export const settingsApi = {
  get: async (): Promise<SalonSettings> => {
    const response = await apiClient.get<SalonSettings>('/settings/')
    return response.data
  },
}

export const usersApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me', {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  updateMe: async (userUpdate: UserUpdate): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me', userUpdate, {
      headers: getAuthHeaders(),
    })
    return response.data
  },
}
