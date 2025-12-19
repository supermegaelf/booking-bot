import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'

function Services() {
  const navigate = useNavigate()
  const { data: services, isLoading, error, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(undefined, true),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => servicesApi.getCategories(),
  })

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'Не удалось загрузить услуги'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="text-xl">←</span>
          <span>Назад</span>
        </button>
        <h1 className="text-3xl font-bold mb-6">Услуги</h1>
        
        {categories && categories.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {categories.map((category) => (
              <span
                key={category}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {service.image_url && (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                {service.category && (
                  <p className="text-sm text-gray-500 mb-2">{service.category}</p>
                )}
                {service.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {parseFloat(service.price).toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-gray-500">
                    {service.duration_minutes} мин
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {services?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Услуги не найдены
          </div>
        )}
      </div>
    </div>
  )
}

export default Services
