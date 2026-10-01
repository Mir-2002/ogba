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
        <div role="alert" className="min-h-screen bg-ink flex items-center justify-center p-4">
          <div className="bg-ink-soft pixel-border text-paper rounded-sm p-6 max-w-md text-center">
            <p className="text-danger text-sm mb-4 font-body">Something went wrong: {this.state.message}</p>
            <button
              onClick={this.handleReset}
              className="bg-shell-light text-paper font-pixel text-xs rounded-sm px-4 py-2 btn-raised active:btn-pressed border-none cursor-pointer"
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
