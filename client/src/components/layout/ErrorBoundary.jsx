import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Catches render-time errors so a single broken page never blanks the whole app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Surfaced in the console for debugging; a real deployment would ship this to a logger.
    console.error('ClinicCare render error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <div className="card card-body max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-600">
            An unexpected error interrupted this page. Returning to the homepage usually resolves it.
          </p>
          <button type="button" onClick={this.handleReset} className="btn-primary mt-5 w-full">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Back to homepage
          </button>
        </div>
      </div>
    )
  }
}
