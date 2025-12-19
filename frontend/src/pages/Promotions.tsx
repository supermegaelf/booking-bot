import { useQuery } from '@tanstack/react-query'
import { promotionsApi } from '../api/client'
import { useNavigate } from 'react-router-dom'

function Promotions() {
  const navigate = useNavigate()
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionsApi.getAll(true),
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="mb-4 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="text-xl">←</span>
          <span>Назад</span>
        </button>
        <h1 className="text-3xl font-bold mb-6">Акции и предложения</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions?.map((promotion) => (
            <div
              key={promotion.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {promotion.image_url && (
                <img
                  src={promotion.image_url}
                  alt={promotion.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2">{promotion.title}</h2>
                {promotion.description && (
                  <p className="text-gray-700 mb-4">{promotion.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-red-600">
                    -{parseFloat(promotion.discount_percent).toFixed(0)}%
                  </span>
                  <div className="text-sm text-gray-500">
                    {new Date(promotion.start_date).toLocaleDateString('ru-RU')} -{' '}
                    {new Date(promotion.end_date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {promotions?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Акции не найдены
          </div>
        )}
      </div>
    </div>
  )
}

export default Promotions
