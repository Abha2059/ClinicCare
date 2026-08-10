import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import reviewService from '../../services/reviewService'
import { formatDate, getErrorMessage } from '../../utils/helpers'

export default function DoctorReviews() {
  useDocumentTitle('Reviews')

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reviewService.mine()
      setReviews(data.reviews || [])
    } catch (err) {
      setError(getErrorMessage(err, 'Your reviews could not be loaded.'))
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Distribution of 5..1 star ratings for the summary bars.
  const { average, distribution } = useMemo(() => {
    if (reviews.length === 0) return { average: 0, distribution: [] }
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }))
    return { average: total / reviews.length, distribution: counts }
  }, [reviews])

  if (loading) return <LoadingState label="Loading reviews…" className="py-24" />
  if (error) return <ErrorState title="Reviews unavailable" message={error} onRetry={load} />

  return (
    <>
      <PageHeader
        title="Patient reviews"
        description="Feedback left by patients after a completed consultation."
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          message="Once you complete consultations, patient reviews will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Average rating" value={average.toFixed(1)} icon={Star} tone="warning" />
            <StatCard label="Total reviews" value={reviews.length} icon={MessageSquare} tone="info" />
            <StatCard
              label="5-star reviews"
              value={distribution.find((d) => d.star === 5)?.count ?? 0}
              icon={Star}
              tone="success"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
            {/* Distribution */}
            <section className="card card-body h-fit" aria-labelledby="distribution-heading">
              <h2 id="distribution-heading" className="text-sm font-semibold text-ink-900">
                Rating breakdown
              </h2>
              <ul className="mt-4 space-y-2.5">
                {distribution.map((d) => {
                  const pct = reviews.length ? (d.count / reviews.length) * 100 : 0
                  return (
                    <li key={d.star} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-sm text-ink-600">{d.star} star</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm text-ink-500">{d.count}</span>
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* Review list */}
            <section aria-labelledby="reviews-list-heading">
              <h2 id="reviews-list-heading" className="sr-only">
                All reviews
              </h2>
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review._id} className="card card-body">
                    <div className="flex items-start gap-3.5">
                      <Avatar src={review.patient?.profileImage} name={review.patient?.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-ink-900">
                            {review.patient?.name || 'Patient'}
                          </p>
                          <span className="text-xs text-ink-400">
                            {formatDate(review.createdAt, { weekday: undefined })}
                          </span>
                        </div>
                        <Rating value={review.rating} size="sm" className="mt-1" />
                        {review.comment && (
                          <p className="mt-2 leading-relaxed text-ink-600">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  )
}
