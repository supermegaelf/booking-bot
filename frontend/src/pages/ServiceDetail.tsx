import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { servicesApi, mastersApi } from '../api/client'

function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const serviceId = parseInt(id || '0')

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getById(serviceId),
    enabled: !!serviceId,
  })

  const { data: masters } = useQuery({
    queryKey: ['masters', 'service', serviceId],
    queryFn: () => mastersApi.getAll(serviceId, true),
    enabled: !!serviceId,
  })

  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Услуга не найдена</h2>
          <Link to="/services" className="text-blue-600 hover:underline">
            Вернуться к услугам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link to="/services" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Назад к услугам
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {service.image_url && (
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{service.name}</h1>
            {service.category && (
              <p className="text-gray-500 mb-4">{service.category}</p>
            )}
            {service.description && (
              <p className="text-gray-700 mb-6">{service.description}</p>
            )}
            <div className="flex justify-between items-center mb-6">
              <span className="text-3xl font-bold text-blue-600">
                {parseFloat(service.price).toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-gray-600">
                Длительность: {service.duration_minutes} минут
              </span>
            </div>

            <Link
              to={`/booking?service_id=${service.id}`}
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Записаться
            </Link>
          </div>
        </div>

        {masters && masters.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Специалисты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masters.map((master) => (
                <Link
                  key={master.id}
                  to={`/masters/${master.id}`}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  {master.photo_url && (
                    <img
                      src={master.photo_url}
                      alt={master.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-lg">{master.name}</h3>
                  {master.specialization && (
                    <p className="text-sm text-gray-500">{master.specialization}</p>
                  )}
                  {master.rating && (
                    <div className="mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">
                        {parseFloat(master.rating).toFixed(1)} ({master.reviews_count})
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceDetail
