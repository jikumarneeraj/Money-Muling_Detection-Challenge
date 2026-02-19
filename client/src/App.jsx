import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Graph-Based Financial Crime Detection Engine
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Money Muling Detection Challenge
        </p>
      </header>

      {!analysisResult ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <FileUpload
            setAnalysisResult={setAnalysisResult}
            setLoading={setLoading}
            loading={loading}
            setUploadedFile={setUploadedFile}
          />
        </div>
      ) : (
        <Dashboard
          data={analysisResult}
          uploadedFile={uploadedFile}
          reset={() => setAnalysisResult(null)}
        />
      )}
    </div>
  );
}

export default App;
