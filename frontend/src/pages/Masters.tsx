import { useQuery } from '@tanstack/react-query'
import { mastersApi } from '../api/client'
import { Link } from 'react-router-dom'

function Masters() {
  const { data: masters, isLoading } = useQuery({
    queryKey: ['masters'],
    queryFn: () => mastersApi.getAll(undefined, true),
  })

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
        <h1 className="text-3xl font-bold mb-6">Специалисты</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masters?.map((master) => (
            <Link
              key={master.id}
              to={`/masters/${master.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {master.photo_url && (
                <img
                  src={master.photo_url}
                  alt={master.name}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{master.name}</h2>
                {master.specialization && (
                  <p className="text-gray-600 text-sm mb-3">{master.specialization}</p>
                )}
                {master.rating && (
                  <div className="mb-3">
                    <span className="text-yellow-500 text-lg">★</span>
                    <span className="ml-1 font-semibold">
                      {parseFloat(master.rating).toFixed(1)}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({master.reviews_count} отзывов)
                    </span>
                  </div>
                )}
                {master.services && master.services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {master.services.slice(0, 3).map((service) => (
                      <span
                        key={service.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {service.name}
                      </span>
                    ))}
                    {master.services.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{master.services.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {masters?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Специалисты не найдены
          </div>
        )}
      </div>
    </div>
  )
}

export default Masters
