import { Component } from 'react'
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="container page-section"><h1>Something went wrong</h1><p>Please reload this page to try again.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button></main>
    return this.props.children
  }
}
