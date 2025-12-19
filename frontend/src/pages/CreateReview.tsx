import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { mastersApi, reviewsApi } from '../api/client'

function CreateReview() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const masterIdParam = searchParams.get('master_id')
  const masterId = masterIdParam ? parseInt(masterIdParam) : null
  const bookingIdParam = searchParams.get('booking_id')
  const bookingId = bookingIdParam ? parseInt(bookingIdParam) : null

  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')

  const { data: master } = useQuery({
    queryKey: ['master', masterId],
    queryFn: () => mastersApi.getById(masterId!),
    enabled: !!masterId,
  })

  const createReviewMutation = useMutation({
    mutationFn: (data: { master_id: number; booking_id: number | null; rating: number; comment: string | null }) =>
      reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['master', masterId] })
      navigate(`/masters/${masterId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!masterId) {
      alert('Мастер не выбран')
      return
    }

    createReviewMutation.mutate({
      master_id: masterId,
      booking_id: bookingId,
      rating,
      comment: comment || null,
    })
  }

  if (!masterId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Мастер не указан</h2>
          <button
            onClick={() => navigate('/masters')}
            className="text-blue-600 hover:underline"
          >
            Вернуться к специалистам
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="text-xl">←</span>
          <span>Назад</span>
        </button>
        <h1 className="text-3xl font-bold mb-6">Оставить отзыв</h1>

        {master && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{master.name}</h2>
            {master.specialization && (
              <p className="text-gray-600">{master.specialization}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Оценка *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl ${
                    star <= rating ? 'text-yellow-500' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Выбрано: {rating} из 5</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Расскажите о вашем опыте..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {createReviewMutation.isPending ? 'Отправка...' : 'Отправить отзыв'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateReview
