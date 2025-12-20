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
          <h2 className="text-3xl font-bold mb-6">Подарочные сертификаты</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-md mx-auto">
            {featuredCertificates.length > 0 && featuredCertificates[0].image_url ? (
              <img
                src={featuredCertificates[0].image_url}
                alt="Пример сертификата"
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                <span className="text-6xl">🎁</span>
              </div>
            )}
            <div className="p-6 text-center">
              <Link
                to="/certificates"
                className="inline-block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Купить
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-4">Режим работы: ПН - ВС / 09:00 - 21:00</p>
            
            <div className="flex justify-center items-center gap-4 mb-6">
              <a
                href="tel:+79020988778"
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Позвонить"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </a>
              {settings?.social_links?.vk && (
                <a
                  href={settings.social_links.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="VK"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.785 16.241s.288-.03.436-.18c.136-.136.132-.392.132-.392s-.02-1.105.48-1.27c.49-.16 1.12 1.08 1.79 1.56.49.36 1.08.28 1.08.28l1.79-.03s.94-.06.49-.8c-.04-.06-.28-.58-1.44-1.65-1.22-1.14-1.06-.48.41-1.47.89-.6 1.25-1.01 1.13-1.19-.1-.16-.72-.12-.72-.12l-1.85.01s-.28-.02-.48.1c-.16.1-.27.33-.27.33s-.48 1.28-1.12 2.37c-1.35 2.31-1.89 2.43-2.11 2.29-.51-.33-.38-1.33-.38-2.04 0-2.22.33-3.15-.65-3.39-.33-.08-.57-.13-1.41-.14-1.08-.02-1.49.01-1.96.28-.27.15-.48.48-.35.5.16.02.52.1.71.36.25.33.24.54.24 1.58 0 .47-.08 1.12-.33 1.58-.2.36-.44.38-.44.38s-.16.02-.36-.27c-.27-.45-.54-1.26-.54-1.72 0-.52.08-1.04-.16-1.43-.13-.2-.37-.27-.49-.28-.1-.01-.22-.01-.22-.01l-1.68.01s-.5.01-.68.23c-.12.15-.01.46-.01.46s.9 2.14 1.92 3.22c.93.98 1.31 1.15 1.46 1.26.22.16.36.13.36.13l1.35-.02s.36-.02.19-.31c-.02-.04-.18-.38-.36-.66-.2-.3-.42-.63-.42-.63s-.03-.24.18-.38c.18-.12.4-.02.4-.02l1.89.01s.5.03.58.24c.06.16.01.3.01.3z"/>
                  </svg>
                </a>
              )}
              {settings?.social_links?.instagram && (
                <a
                  href={settings.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Instagram"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {settings?.social_links?.telegram && (
                <a
                  href={settings.social_links.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Telegram"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.169 1.858-.896 6.728-.896 6.728-.518 2.953-1.028 3.719-1.69 3.719-.562 0-.896-.518-1.396-1.028-.618-.518-1.028-.896-1.662-1.396-.733-.562-.259-.896.169-1.396.345-.345 6.211-5.728 6.338-6.211.034-.138.034-.259-.138-.345-.138-.069-.345-.034-.483.034-.172.103-4.138 2.621-5.69 3.862-.207.138-.345.207-.518.207-.138 0-.345-.034-.518-.207-.345-.207-1.207-1.207-2.069-1.862-.69-.518-1.241-.518-1.724.138-.345.518-.896 1.207-1.207 1.862-.207.345-.345.518-.207.69.138.138.345.207.518.207.207.034.414.103.621.207.207.138 1.207.69 1.724.896.518.207 1.034.345 1.552.345.518 0 1.034-.138 1.552-.345.518-.207 1.207-.69 1.724-.896.518-.207 1.034-.345 1.552-.345.518 0 1.034.138 1.552.345.518.207 1.207.69 1.724.896.518.207 1.034.345 1.552.345.518 0 1.034-.138 1.552-.345.518-.207 1.207-.69 1.724-.896.518-.207 1.034-.345 1.552-.345.518 0 1.034.138 1.552.345z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {settings?.map_coordinates && (
            <div className="mb-6">
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

          <div className="text-center">
            {settings?.mini_logo_url && (
              <div className="mb-4">
                <img
                  src={settings.mini_logo_url}
                  alt="LL BeautyBar"
                  className="h-16 mx-auto"
                />
              </div>
            )}
            <p className="text-gray-700 mb-2">Волгоград / Мира, 6</p>
            <p className="text-gray-600 text-sm">Политика конфиденциальности</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

