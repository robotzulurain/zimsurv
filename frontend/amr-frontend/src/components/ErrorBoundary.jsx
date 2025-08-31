import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null, info:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ this.setState({ info }); console.error("ErrorBoundary:", error, info); }
  render(){
    if(this.state.hasError){
      return (
        <div style={{background:"#fff7ed", border:"1px solid #fdba74", color:"#7c2d12", padding:16, borderRadius:12}}>
          <h3 style={{marginTop:0}}>Something broke in this view</h3>
          <div style={{whiteSpace:"pre-wrap", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace"}}>
            {String(this.state.error || "")}
            {this.state.info?.componentStack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
