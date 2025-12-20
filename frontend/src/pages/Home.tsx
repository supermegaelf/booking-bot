import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { servicesApi, promotionsApi, settingsApi, certificatesApi } from '../api/client'
import { useState, useEffect } from 'react'

function PromotionTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const difference = end - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft(`${days}д ${hours}ч ${minutes}м ${seconds}с`)
      } else {
        setTimeLeft('Акция завершена')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endDate])

  if (!timeLeft) return null

  return (
    <div className="text-sm text-gray-600 mt-2">
      <span className="font-semibold">До окончания: </span>
      {timeLeft}
    </div>
  )
}

function Home() {
  const { data: services } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: () => servicesApi.getAll(undefined, true),
  })

  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'featured'],
    queryFn: () => promotionsApi.getAll(true),
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })

  const { data: certificates } = useQuery({
    queryKey: ['certificates', 'available'],
    queryFn: () => certificatesApi.getAvailable(),
  })

  const featuredServiceNames = ['Маникюр', 'Брови', 'Педикюр', 'Мейк', 'Шугаринг', 'Массаж', 'Укладка']
  const featuredServices = services?.filter(s => featuredServiceNames.includes(s.name)) || []
  
  const featuredCertificates = certificates?.slice(0, 3) || []
  
  const mapCoordinates = settings?.map_coordinates?.split(',').map(c => c.trim()) || ['48.706836', '44.511980']
  const yandexMapUrl = `https://yandex.ru/map-widget/v1/?ll=${mapCoordinates[1]},${mapCoordinates[0]}&pt=${mapCoordinates[1]},${mapCoordinates[0]}&z=16`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-cover bg-center" style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="mb-6">
            <div className="text-6xl font-bold mb-2">💅</div>
            <h1 className="text-5xl font-bold mb-4">LL BeautyBar</h1>
          </div>
          <p className="text-2xl mb-4">Салон красоты в Волгограде</p>
          {settings?.address && (
            <p className="text-lg text-white/90 mb-8">{settings.address}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Записаться
            </Link>
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Связаться
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {featuredServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Услуги</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredServices.map((service) => (
                <Link
                  key={service.id}
                  to={`/booking?service_id=${service.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                      <span className="text-4xl">💅</span>
                    </div>
                  )}
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {promotions && promotions.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Акции и специальные предложения</h2>
              <Link
                to="/promotions"
                className="text-blue-600 hover:underline"
              >
                Все акции →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.slice(0, 2).map((promotion) => (
                <Link
                  key={promotion.id}
                  to="/promotions"
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {promotion.image_url && (
                    <img
                      src={promotion.image_url}
                      alt={promotion.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{promotion.title}</h3>
                    {promotion.description && (
                      <p className="text-gray-600 text-sm mb-2">{promotion.description}</p>
                    )}
                    <span className="text-2xl font-bold text-red-600">
                      -{parseFloat(promotion.discount_percent).toFixed(0)}%
                    </span>
                    <PromotionTimer endDate={promotion.end_date} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Подарочные сертификаты</h2>
            <Link
              to="/certificates"
              className="text-blue-600 hover:underline font-medium"
            >
              Все сертификаты →
            </Link>
          </div>
          {featuredCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredCertificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {certificate.image_url && (
                    <img
                      src={certificate.image_url}
                      alt={`Сертификат ${certificate.amount} ₽`}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {parseFloat(certificate.amount).toLocaleString('ru-RU')} ₽
                    </div>
                    {certificate.description && typeof certificate.description === 'object' && (
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        {certificate.description.what_included && (
                          <div><strong>Что включено:</strong> {certificate.description.what_included}</div>
                        )}
                        {certificate.description.validity && (
                          <div><strong>Срок действия:</strong> {certificate.description.validity}</div>
                        )}
                        {certificate.description.usage && (
                          <div><strong>Использование:</strong> {certificate.description.usage}</div>
                        )}
                        {certificate.description.where_to_use && (
                          <div><strong>Где использовать:</strong> {certificate.description.where_to_use}</div>
                        )}
                      </div>
                    )}
                    <Link
                      to="/certificates"
                      className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Купить
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
              Сертификаты скоро появятся
            </div>
          )}
        </div>

        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Контакты</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Информация</h3>
              {settings?.address && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Адрес:</div>
                  <div className="font-medium">{settings.address}</div>
                </div>
              )}
              {settings?.phone && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Телефон:</div>
                  <a href={`tel:${settings.phone}`} className="font-medium text-blue-600 hover:underline">
                    {settings.phone}
                  </a>
                </div>
              )}
              {settings?.email && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Email:</div>
                  <a href={`mailto:${settings.email}`} className="font-medium text-blue-600 hover:underline">
                    {settings.email}
                  </a>
                </div>
              )}
              {settings?.working_hours && typeof settings.working_hours === 'object' && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Рабочие часы:</div>
                  <div className="font-medium">
                    {Object.entries(settings.working_hours).map(([day, hours]) => (
                      <div key={day}>{day}: {hours as string}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Социальные сети</h3>
              <div className="flex flex-col gap-2">
                {settings?.social_links?.vk && (
                  <a
                    href={settings.social_links.vk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <span>VK</span>
                  </a>
                )}
                {settings?.social_links?.instagram && (
                  <a
                    href={settings.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <span>Instagram</span>
                  </a>
                )}
                {settings?.social_links?.telegram && (
                  <a
                    href={settings.social_links.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <span>Telegram</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {settings?.map_coordinates && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Как нас найти</h3>
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <iframe
                  src={yandexMapUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title="Карта салона LL BeautyBar"
                ></iframe>
              </div>
            </div>
          )}
        </div>

        {settings?.privacy_policy_text && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Политика конфиденциальности</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {settings.privacy_policy_text}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

