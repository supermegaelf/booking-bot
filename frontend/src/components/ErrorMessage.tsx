interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
