import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi } from '../api/client'
import { Link } from 'react-router-dom'
import { useState } from 'react'

function Bookings() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter || undefined],
    queryFn: () => bookingsApi.getAll(statusFilter || undefined),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  const handleCancel = (id: number) => {
    if (confirm('Вы уверены, что хотите отменить запись?')) {
      cancelMutation.mutate(id)
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

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Ожидают
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Подтверждены
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Завершены
          </button>
        </div>

        <div className="space-y-4">
          {bookings?.map((booking) => (
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
                {booking.status !== 'cancelled' &&
                  booking.status !== 'completed' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Отменить
                    </button>
                  )}
                {booking.status === 'completed' && booking.master && (
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

        {bookings?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Записи не найдены
          </div>
        )}
      </div>
    </div>
  )
}

export default Bookings
