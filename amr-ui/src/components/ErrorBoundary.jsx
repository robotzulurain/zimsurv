import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("UI crashed:", error, info); }
  render(){
    if (this.state.error){
      return (
        <div style={{padding:16}}>
          <h2>Something went wrong.</h2>
          <pre style={{whiteSpace:'pre-wrap', background:'#111', color:'#fff', padding:12, borderRadius:8}}>
{String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
