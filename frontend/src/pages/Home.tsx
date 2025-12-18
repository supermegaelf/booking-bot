import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { servicesApi, promotionsApi, settingsApi } from '../api/client'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">LL BeautyBar</h1>
          <p className="text-xl mb-6">Салон красоты в Волгограде</p>
          {settings?.address && (
            <p className="text-blue-100">{settings.address}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/services"
            className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">💇</div>
            <h2 className="text-xl font-semibold mb-2">Услуги</h2>
            <p className="text-gray-600 text-sm">Посмотреть все услуги</p>
          </Link>

          <Link
            to="/masters"
            className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">👨‍💼</div>
            <h2 className="text-xl font-semibold mb-2">Специалисты</h2>
            <p className="text-gray-600 text-sm">Наши мастера</p>
          </Link>

          <Link
            to="/booking"
            className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">📅</div>
            <h2 className="text-xl font-semibold mb-2">Записаться</h2>
            <p className="text-gray-600 text-sm">Онлайн запись</p>
          </Link>

          <Link
            to="/bookings"
            className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-xl font-semibold mb-2">Мои записи</h2>
            <p className="text-gray-600 text-sm">Управление записями</p>
          </Link>
        </div>

        {promotions && promotions.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Акции</h2>
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
                    <span className="text-2xl font-bold text-red-600">
                      -{parseFloat(promotion.discount_percent).toFixed(0)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {services && services.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Популярные услуги</h2>
              <Link
                to="/services"
                className="text-blue-600 hover:underline"
              >
                Все услуги →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services.slice(0, 3).map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-600">
                        {parseFloat(service.price).toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-gray-500 text-sm">
                        {service.duration_minutes} мин
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/profile"
              className="text-gray-700 hover:text-blue-600"
            >
              Профиль
            </Link>
            <Link
              to="/certificates"
              className="text-gray-700 hover:text-blue-600"
            >
              Сертификаты
            </Link>
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="text-gray-700 hover:text-blue-600"
              >
                Телефон: {settings.phone}
              </a>
            )}
            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="text-gray-700 hover:text-blue-600"
              >
                Email: {settings.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

