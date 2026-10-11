import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

function LoadingPage() {
  const { t } = useTranslation()
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimeoutReached(true), 20000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative">

      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">
          {timeoutReached ? (
            <>
              {t("status.serversAsleep")}
              <br />
              {t("status.wakingUp")}
            </>
          ) : (
            t("status.pleaseWait")
          )}
        </p>
      </div>
    </div>
  )
}

export default LoadingPage