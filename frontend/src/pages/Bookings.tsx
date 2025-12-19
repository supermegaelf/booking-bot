import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi, mastersApi } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { Booking } from '../api/types'

function RescheduleModal({ 
  booking, 
  onClose, 
  onSuccess 
}: { 
  booking: Booking
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const navigate = useNavigate()

  const { data: availableSlots } = useQuery({
    queryKey: ['available-slots', booking.service_id, selectedDate, booking.master_id],
    queryFn: () => {
      if (!selectedDate) throw new Error('Date required')
      if (booking.master_id) {
        return mastersApi.getAvailableSlots(booking.master_id, selectedDate, booking.service_id)
      }
      return mastersApi.getAvailableSlotsForService(booking.service_id, selectedDate, booking.master_id)
    },
    enabled: !!selectedDate && !!booking.service_id,
  })

  const rescheduleMutation = useMutation({
    mutationFn: (data: { booking_date: string; booking_time: string }) =>
      bookingsApi.reschedule(booking.id, data),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  const today = new Date()
  const maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  const dates: Date[] = []
  
  for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }

  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  const formatDateDisplay = (date: Date) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`
  }

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      alert('Пожалуйста, выберите дату и время')
      return
    }
    rescheduleMutation.mutate({
      booking_date: selectedDate,
      booking_time: selectedTime,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Перенос записи</h2>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Текущая запись:</h3>
          <p className="text-gray-600">
            {new Date(booking.booking_date).toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} в {booking.booking_time}
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Выберите новую дату:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {dates.map((date) => {
              const dateStr = formatDate(date)
              const isSelected = selectedDate === dateStr
              
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr)
                    setSelectedTime('')
                  }}
                  className={`p-3 rounded-lg border-2 text-center text-sm ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  {formatDateDisplay(date)}
                </button>
              )
            })}
          </div>
        </div>

        {selectedDate && availableSlots && availableSlots.slots.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Выберите время:</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {availableSlots.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    selectedTime === slot.time
                      ? 'border-blue-500 bg-blue-50'
                      : slot.available
                      ? 'border-gray-200 bg-white hover:border-blue-300'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || rescheduleMutation.isPending}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {rescheduleMutation.isPending ? 'Перенос...' : 'Перенести'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Bookings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null)

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getAll(),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error: Error) => {
      alert(error.message || 'Не удалось отменить запись')
    },
  })

  const activeBookings = bookings?.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  ) || []

  const historyBookings = bookings?.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  ) || []

  const canCancel = (booking: Booking) => {
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
    const now = new Date()
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilBooking >= 24
  }

  const handleCancel = (booking: Booking) => {
    if (!canCancel(booking)) {
      alert('Отмена записи возможна не позднее чем за 24 часа до назначенного времени')
      return
    }

    if (confirm('Вы уверены, что хотите отменить запись?')) {
      cancelMutation.mutate(booking.id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Подтверждена'
      case 'pending':
        return 'Ожидает подтверждения'
      case 'completed':
        return 'Завершена'
      case 'cancelled':
        return 'Отменена'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  const displayedBookings = activeTab === 'active' ? activeBookings : historyBookings

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Мои записи</h1>
          <Link
            to="/booking"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Новая запись
          </Link>
        </div>

        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Активные записи ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            История посещений ({historyBookings.length})
          </button>
        </div>

        <div className="space-y-4">
          {displayedBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{booking.service.name}</h2>
                  <p className="text-gray-600">
                    {new Date(booking.booking_date).toLocaleDateString('ru-RU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' в '}
                    {booking.booking_time}
                  </p>
                  {booking.master && (
                    <p className="text-gray-600 mt-1">Специалист: {booking.master.name}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {getStatusText(booking.status)}
                </span>
              </div>

              {booking.comment && (
                <p className="text-gray-700 mb-4">{booking.comment}</p>
              )}

              <div className="flex gap-2">
                {activeTab === 'active' && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <>
                    <button
                      onClick={() => handleCancel(booking)}
                      disabled={cancelMutation.isPending || !canCancel(booking)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!canCancel(booking) ? 'Отмена возможна не позднее чем за 24 часа' : ''}
                    >
                      Отменить
                    </button>
                    <button
                      onClick={() => setRescheduleBooking(booking)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Перенести
                    </button>
                  </>
                )}
                {activeTab === 'history' && booking.status === 'completed' && booking.master && (
                  <Link
                    to={`/reviews/create?master_id=${booking.master.id}&booking_id=${booking.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Оставить отзыв
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {displayedBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {activeTab === 'active' ? 'Нет активных записей' : 'История пуста'}
          </div>
        )}
      </div>

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] })
          }}
        />
      )}
    </div>
  )
}

export default Bookings
