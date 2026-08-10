import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen bg-bg flex items-center justify-center">
          <div className="bg-surface gba-card rounded-2xl p-6 max-w-md text-center">
            <p className="text-red text-sm mb-4">Something went wrong: {this.state.message}</p>
            <button
              onClick={this.handleReset}
              className="bg-accent text-white rounded-lg px-4 py-2 neu-button active:neu-button-pressed border-none cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
