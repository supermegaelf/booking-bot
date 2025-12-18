import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { servicesApi, mastersApi, bookingsApi, certificatesApi } from '../api/client'
import type { BookingCreate } from '../api/types'

function Booking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const serviceIdParam = searchParams.get('service_id')
  const serviceId = serviceIdParam ? parseInt(serviceIdParam) : null

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(serviceId)
  const [selectedMasterId, setSelectedMasterId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [comment, setComment] = useState<string>('')
  const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null)

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(undefined, true),
  })

  const { data: service } = useQuery({
    queryKey: ['service', selectedServiceId],
    queryFn: () => servicesApi.getById(selectedServiceId!),
    enabled: !!selectedServiceId,
  })

  const { data: masters } = useQuery({
    queryKey: ['masters', 'service', selectedServiceId],
    queryFn: () => mastersApi.getAll(selectedServiceId || undefined, true),
    enabled: !!selectedServiceId,
  })

  const { data: availableSlots } = useQuery({
    queryKey: ['available-slots', selectedServiceId, selectedDate, selectedMasterId],
    queryFn: () => {
      if (!selectedServiceId || !selectedDate) throw new Error('Missing params')
      if (selectedMasterId) {
        return mastersApi.getAvailableSlots(selectedMasterId, selectedDate, selectedServiceId)
      }
      return mastersApi.getAvailableSlotsForService(selectedServiceId, selectedDate)
    },
    enabled: !!selectedServiceId && !!selectedDate,
  })

  const { data: certificates } = useQuery({
    queryKey: ['certificates', 'unused'],
    queryFn: () => certificatesApi.getAll(false),
  })

  const createBookingMutation = useMutation({
    mutationFn: (booking: BookingCreate) => bookingsApi.create(booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      navigate('/bookings')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    createBookingMutation.mutate({
      service_id: selectedServiceId,
      master_id: selectedMasterId,
      booking_date: selectedDate,
      booking_time: selectedTime,
      comment: comment || null,
      certificate_id: selectedCertificateId,
    })
  }

  const minDate = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Запись на услугу</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Услуга *
            </label>
            <select
              value={selectedServiceId || ''}
              onChange={(e) => {
                setSelectedServiceId(e.target.value ? parseInt(e.target.value) : null)
                setSelectedMasterId(null)
                setSelectedTime('')
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            >
              <option value="">Выберите услугу</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {parseFloat(s.price).toLocaleString('ru-RU')} ₽
                </option>
              ))}
            </select>
          </div>

          {selectedServiceId && masters && masters.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Специалист
              </label>
              <select
                value={selectedMasterId || ''}
                onChange={(e) => {
                  setSelectedMasterId(e.target.value ? parseInt(e.target.value) : null)
                  setSelectedTime('')
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Любой специалист</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setSelectedTime('')
              }}
              min={minDate}
              max={maxDate}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {availableSlots && availableSlots.slots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedTime === slot.time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : slot.available
                        ? 'border-gray-300 hover:border-blue-500'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {selectedTime && (
                <p className="mt-2 text-sm text-gray-600">
                  Выбрано время: {selectedTime}
                </p>
              )}
            </div>
          )}

          {certificates && certificates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Использовать сертификат
              </label>
              <select
                value={selectedCertificateId || ''}
                onChange={(e) =>
                  setSelectedCertificateId(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Не использовать</option>
                {certificates.map((cert) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.code} - {parseFloat(cert.amount).toLocaleString('ru-RU')} ₽
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Дополнительная информация..."
            />
          </div>

          <button
            type="submit"
            disabled={createBookingMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {createBookingMutation.isPending ? 'Создание записи...' : 'Записаться'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Booking
