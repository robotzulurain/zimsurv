import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import ManualEntry from './components/ManualEntry';
import CSVUpload from './components/CSVUpload';
import LabResultsTable from './components/LabResultsTable';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const token = localStorage.getItem('token') || '';

  return (
    <div className="App" style={{ padding: 16 }}>
      <h1>AMR Surveillance Dashboard</h1>
      {isLoggedIn ? (
        <>
          <ManualEntry />
          <CSVUpload token={token} />
          <LabResultsTable />
        </>
      ) : (
        <LoginForm setToken={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}
