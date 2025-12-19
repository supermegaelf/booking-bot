import { useQuery } from '@tanstack/react-query'
import { certificatesApi } from '../api/client'
import { useState } from 'react'

function Certificates() {
  const [filterUsed, setFilterUsed] = useState<boolean | undefined>(undefined)

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', filterUsed],
    queryFn: () => certificatesApi.getAll(filterUsed),
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
        <h1 className="text-3xl font-bold mb-6">Мои сертификаты</h1>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilterUsed(undefined)}
            className={`px-4 py-2 rounded-lg ${
              filterUsed === undefined ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilterUsed(false)}
            className={`px-4 py-2 rounded-lg ${
              filterUsed === false ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setFilterUsed(true)}
            className={`px-4 py-2 rounded-lg ${
              filterUsed === true ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Использованные
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates?.map((certificate) => (
            <div
              key={certificate.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                certificate.is_used ? 'opacity-60' : ''
              }`}
            >
              {certificate.image_url && (
                <img
                  src={certificate.image_url}
                  alt={certificate.code}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{certificate.code}</h2>
                  {certificate.is_used && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                      Использован
                    </span>
                  )}
                </div>
                {certificate.category && (
                  <p className="text-sm text-gray-500 mb-2">{certificate.category}</p>
                )}
                <p className="text-2xl font-bold text-blue-600 mb-4">
                  {parseFloat(certificate.amount).toLocaleString('ru-RU')} ₽
                </p>
                {certificate.description && (
                  <div className="text-sm text-gray-600 mb-2">
                    {JSON.stringify(certificate.description)}
                  </div>
                )}
                {certificate.expires_at && (
                  <p className="text-sm text-gray-500">
                    Действителен до:{' '}
                    {new Date(certificate.expires_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
                {certificate.used_at && (
                  <p className="text-sm text-gray-500">
                    Использован:{' '}
                    {new Date(certificate.used_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {certificates?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Сертификаты не найдены
          </div>
        )}
      </div>
    </div>
  )
}

export default Certificates
