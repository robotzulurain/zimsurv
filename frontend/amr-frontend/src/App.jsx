import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TopNav from "./components/TopNav";
import "./app.css";

import Home from "./pages/Home";
import Trends from "./pages/Trends";
import Resistance from "./pages/Resistance";
import SexAge from "./pages/SexAge";
import DataQuality from "./pages/DataQuality";
import LabResults from "./pages/LabResults";
import DataEntry from "./pages/DataEntry";
import Geo from "./pages/Geo";
import Debug from "./pages/Debug";

export default function App(){
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/resistance" element={<Resistance />} />
        <Route path="/sex-age" element={<SexAge />} />
        <Route path="/data-quality" element={<DataQuality />} />
        <Route path="/lab-results" element={<LabResults />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/geo" element={<Geo />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
