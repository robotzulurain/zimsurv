import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("ErrorBoundary caught:", error, info); }
  render(){
    if (this.state.error){
      return (
        <div style={{padding:16, fontFamily:"system-ui"}}>
          <h2 style={{color:"crimson"}}>Something went wrong.</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
