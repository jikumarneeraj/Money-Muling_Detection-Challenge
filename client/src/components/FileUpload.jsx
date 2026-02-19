import React, { useCallback, useState } from 'react';

const FileUpload = ({ setAnalysisResult, setLoading, loading, setUploadedFile }) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        setUploadedFile(file);
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Analysis failed. Please check CSV format.');
            }

            const result = await response.json();
            setAnalysisResult(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    return (
        <div
            className="card"
            style={{
                textAlign: 'center',
                padding: '3rem',
                borderStyle: 'dashed',
                borderColor: dragActive ? 'var(--accent)' : 'var(--border)',
                backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                    <p>Analyzing transactions... This may take a few seconds.</p>
                </div>
            ) : (
                <>
                    <svg style={{ width: '64px', height: '64px', color: 'var(--text-muted)', marginBottom: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h3 style={{ marginBottom: '0.5rem' }}>Upload Transaction CSV</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Drag and drop or click to select</p>
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => handleFiles(e.target.files)}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="btn-primary" style={{ display: 'inline-block' }}>
                        Select File
                    </label>
                    {error && (
                        <div style={{ marginTop: '1rem', color: 'var(--danger)', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                            {error}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FileUpload;
