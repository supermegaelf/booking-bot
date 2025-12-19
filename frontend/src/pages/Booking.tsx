import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { servicesApi, mastersApi, bookingsApi, certificatesApi, usersApi } from '../api/client'
import { getTelegramUser } from '../utils/telegram'
import type { BookingCreate, Service, Master, Certificate } from '../api/types'

type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

function Booking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const serviceIdParam = searchParams.get('service_id')
  const initialServiceId = serviceIdParam ? parseInt(serviceIdParam) : null

  const [step, setStep] = useState<BookingStep>(initialServiceId ? 2 : 1)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(initialServiceId)
  const [selectedMasterId, setSelectedMasterId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [comment, setComment] = useState<string>('')
  const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null)

  const telegramUser = getTelegramUser()

  const { data: userProfile } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersApi.getMe(),
    retry: false,
  })

  useEffect(() => {
    if (userProfile?.phone) {
      setPhone(userProfile.phone)
    }
    if (userProfile?.email) {
      setEmail(userProfile.email)
    }
  }, [userProfile])

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
      setStep(7)
    },
  })

  const handleNext = () => {
    if (step < 7) {
      setStep((step + 1) as BookingStep)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as BookingStep)
    }
  }

  const handleServiceSelect = (serviceId: number) => {
    setSelectedServiceId(serviceId)
    setSelectedMasterId(null)
    setSelectedDate('')
    setSelectedTime('')
    handleNext()
  }

  const handleMasterSelect = (masterId: number | null) => {
    setSelectedMasterId(masterId)
    setSelectedDate('')
    setSelectedTime('')
    handleNext()
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    handleNext()
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    handleNext()
  }

  const handleContactSubmit = () => {
    if (!phone) {
      alert('Пожалуйста, укажите номер телефона')
      return
    }
    handleNext()
  }

  const handleConfirm = () => {
    if (!selectedServiceId || !selectedDate || !selectedTime || !phone) {
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours} ч ${mins > 0 ? `${mins} мин` : ''}`
    }
    return `${mins} мин`
  }

  const renderStep1 = () => {
    if (!services) return <div>Загрузка...</div>

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Выберите услугу</h2>
        <div className="space-y-3">
          {services.map((s: Service) => (
            <button
              key={s.id}
              onClick={() => handleServiceSelect(s.id)}
              className="w-full text-left bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200"
            >
              {s.category && (
                <div className="text-sm text-gray-500 mb-1">{s.category}</div>
              )}
              <h3 className="text-lg font-semibold mb-2">{s.name}</h3>
              {s.description && (
                <div className="text-gray-600 text-sm mb-2">
                  {formatDuration(s.duration_minutes)} · {s.description}
                </div>
              )}
              <div className="text-xl font-bold text-blue-600">
                {parseFloat(s.price).toLocaleString('ru-RU')} ₽
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderStep2 = () => {
    if (!masters) return <div>Загрузка...</div>

    const handleMasterClick = (masterId: number) => {
      navigate(`/masters/${masterId}`)
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Выберите специалиста</h2>
        {masters.length === 1 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Для этой услуги доступен только один специалист
            </p>
          </div>
        )}
        <div className="space-y-3">
          {masters.length > 1 && (
            <button
              onClick={() => handleMasterSelect(null)}
              className={`w-full text-left bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-2 ${
                selectedMasterId === null ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Любой специалист</h3>
                  <p className="text-sm text-gray-600">Система выберет ближайший доступный слот</p>
                </div>
              </div>
            </button>
          )}
          {masters.map((m: Master) => (
            <button
              key={m.id}
              onClick={() => handleMasterSelect(m.id)}
              className={`w-full text-left bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-2 ${
                selectedMasterId === m.id ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{m.name}</h3>
                  {m.specialization && (
                    <p className="text-sm text-gray-600 mb-2">{m.specialization}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    {m.rating && (
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span className="font-semibold">{parseFloat(m.rating).toFixed(1)}</span>
                      </div>
                    )}
                    {m.reviews_count > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMasterClick(m.id)
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        {m.reviews_count} {m.reviews_count === 1 ? 'отзыв' : 'отзывов'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderStep3 = () => {
    const today = new Date()
    const maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
    const dates: Date[] = []
    
    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    const formatDateDisplay = (date: Date) => {
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
      const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
      return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`
    }

    const isToday = (date: Date) => {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Выберите дату</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dates.map((date) => {
            const dateStr = formatDate(date)
            const isSelected = selectedDate === dateStr
            const isPast = date < today && !isToday(date)
            
            return (
              <button
                key={dateStr}
                onClick={() => !isPast && handleDateSelect(dateStr)}
                disabled={isPast}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isPast
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm font-semibold">{formatDateDisplay(date)}</div>
                {isToday(date) && (
                  <div className="text-xs text-blue-600 mt-1">Сегодня</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderStep4 = () => {
    if (!availableSlots || availableSlots.slots.length === 0) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Выберите время</h2>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">На выбранную дату нет доступных слотов</p>
          </div>
          <button
            onClick={handleBack}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Выбрать другую дату
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Выберите время</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {availableSlots.slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => slot.available && handleTimeSelect(slot.time)}
              disabled={!slot.available}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                selectedTime === slot.time
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
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
    )
  }

  const renderStep5 = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Контактные данные</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <input
              type="text"
              value={telegramUser?.first_name || ''}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Из Telegram</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (опционально)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
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
                {certificates.map((cert: Certificate) => (
                  <option key={cert.id} value={cert.id}>
                    {cert.code} - {parseFloat(cert.amount).toLocaleString('ru-RU')} ₽
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий (опционально)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Дополнительная информация..."
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
          >
            Назад
          </button>
          <button
            onClick={handleContactSubmit}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Продолжить
          </button>
        </div>
      </div>
    )
  }

  const renderStep6 = () => {
    const selectedMaster = masters?.find((m: Master) => m.id === selectedMasterId)
    const selectedCertificate = certificates?.find((c: Certificate) => c.id === selectedCertificateId)

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Подтверждение записи</h2>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Услуга</h3>
            <p className="text-lg font-semibold">{service?.name}</p>
            {service?.category && (
              <p className="text-sm text-gray-600">{service.category}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Специалист</h3>
            <p className="text-lg font-semibold">
              {selectedMaster ? selectedMaster.name : 'Любой специалист'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Дата и время</h3>
            <p className="text-lg font-semibold">
              {new Date(selectedDate).toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} в {selectedTime}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Стоимость</h3>
            <p className="text-lg font-semibold text-blue-600">
              {service && parseFloat(service.price).toLocaleString('ru-RU')} ₽
            </p>
            {selectedCertificate && (
              <p className="text-sm text-gray-600 mt-1">
                Сертификат: {parseFloat(selectedCertificate.amount).toLocaleString('ru-RU')} ₽
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Контактные данные</h3>
            <p className="text-lg">{telegramUser?.first_name || 'Не указано'}</p>
            <p className="text-sm text-gray-600">{phone}</p>
            {email && <p className="text-sm text-gray-600">{email}</p>}
          </div>
          {comment && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Комментарий</h3>
              <p className="text-sm text-gray-700">{comment}</p>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
          >
            Назад
          </button>
          <button
            onClick={handleConfirm}
            disabled={createBookingMutation.isPending}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createBookingMutation.isPending ? 'Создание записи...' : 'Подтвердить запись'}
          </button>
        </div>
      </div>
    )
  }

  const renderStep7 = () => {
    return (
      <div className="space-y-4 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-bold mb-4">Запись успешно создана!</h2>
        <p className="text-gray-600 mb-8">
          Мы отправили вам уведомление в Telegram. Ожидайте подтверждения от администратора.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Вернуться на главную
        </Link>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      case 6:
        return renderStep6()
      case 7:
        return renderStep7()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {step !== 7 && (
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span>←</span>
            <span>На главную</span>
          </button>
        )}
        {step !== 7 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Шаг {step} из 6
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}

export default Booking
