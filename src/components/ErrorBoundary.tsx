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
        <div role="alert" style={{ padding: '16px', textAlign: 'center', color: '#f66' }}>
          <p>Something went wrong: {this.state.message}</p>
          <button onClick={this.handleReset} style={{ marginTop: '8px' }}>
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
