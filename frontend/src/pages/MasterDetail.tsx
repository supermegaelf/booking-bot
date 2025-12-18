import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { mastersApi, reviewsApi } from '../api/client'

function MasterDetail() {
  const { id } = useParams<{ id: string }>()
  const masterId = parseInt(id || '0')

  const { data: master, isLoading: masterLoading } = useQuery({
    queryKey: ['master', masterId],
    queryFn: () => mastersApi.getById(masterId),
    enabled: !!masterId,
  })

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'master', masterId],
    queryFn: () => reviewsApi.getByMaster(masterId),
    enabled: !!masterId,
  })

  if (masterLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!master) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Специалист не найден</h2>
          <Link to="/masters" className="text-blue-600 hover:underline">
            Вернуться к специалистам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link to="/masters" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Назад к специалистам
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="md:flex">
            {master.photo_url && (
              <img
                src={master.photo_url}
                alt={master.name}
                className="w-full md:w-64 h-64 object-cover"
              />
            )}
            <div className="p-6 flex-1">
              <h1 className="text-3xl font-bold mb-2">{master.name}</h1>
              {master.specialization && (
                <p className="text-gray-600 mb-4">{master.specialization}</p>
              )}
              {master.rating && (
                <div className="mb-4">
                  <span className="text-yellow-500 text-2xl">★</span>
                  <span className="ml-2 text-xl font-semibold">
                    {parseFloat(master.rating).toFixed(1)}
                  </span>
                  <span className="text-gray-500 ml-2">
                    ({master.reviews_count} отзывов)
                  </span>
                </div>
              )}
              {master.phone && (
                <p className="text-gray-700 mb-2">Телефон: {master.phone}</p>
              )}
            </div>
          </div>
        </div>

        {master.services && master.services.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Услуги</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {master.services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold mb-2">{service.name}</h3>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-bold">
                      {parseFloat(service.price).toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="text-gray-500">{service.duration_minutes} мин</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Отзывы</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterDetail
