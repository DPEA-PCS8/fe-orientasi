import React, { useState, useEffect } from 'react';
import type { PksiFileData } from '../api/pksiFileApi';
import { getPksiFileHistory, downloadPksiFileVersion } from '../api/pksiFileApi';
import type { Fs2FileData } from '../api/fs2FileApi';
import { getFs2FileHistory, downloadFs2FileVersion } from '../api/fs2FileApi';

// ==================== TYPES ====================

type FileData = PksiFileData | Fs2FileData;

interface FileVersionHistoryProps {
  /** The document ID (PKSI ID or FS2 ID) */
  documentId: string;
  /** The file type to show history for */
  fileType: string;
  /** Type of document: 'pksi' or 'fs2' */
  documentType: 'pksi' | 'fs2';
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Custom title for the modal */
  title?: string;
}

// ==================== COMPONENT ====================

export const FileVersionHistory: React.FC<FileVersionHistoryProps> = ({
  documentId,
  fileType,
  documentType,
  isOpen,
  onClose,
  title,
}) => {
  const [history, setHistory] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId && fileType) {
      fetchHistory();
    }
  }, [isOpen, documentId, fileType]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: FileData[];
      if (documentType === 'pksi') {
        data = await getPksiFileHistory(documentId, fileType);
      } else {
        data = await getFs2FileHistory(documentId, fileType);
      }
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileData) => {
    setDownloadingId(file.id);
    try {
      const fileName = file.display_name || file.original_name;
      if (documentType === 'pksi') {
        await downloadPksiFileVersion(documentId, fileType, file.version, fileName);
      } else {
        await downloadFs2FileVersion(documentId, fileType, file.version, fileName);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="file-history-overlay" onClick={onClose}>
      <div className="file-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="file-history-header">
          <h3>{title || `Riwayat Versi File ${fileType}`}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="file-history-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Memuat riwayat versi...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchHistory}>Coba Lagi</button>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="empty-state">
              <p>Belum ada riwayat versi untuk file ini.</p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="version-list">
              {history.map((file) => (
                <div 
                  key={file.id} 
                  className={`version-item ${file.is_latest_version ? 'latest' : ''}`}
                >
                  <div className="version-info">
                    <div className="version-header">
                      <span className="version-badge">V{file.version}</span>
                      {file.is_latest_version && (
                        <span className="latest-badge">Terbaru</span>
                      )}
                    </div>
                    <p className="file-name">{file.display_name || file.original_name}</p>
                    <div className="file-meta">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span className="separator">•</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.id}
                  >
                    {downloadingId === file.id ? (
                      <span className="spinner-small"></span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .file-history-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .file-history-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .file-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .file-history-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .file-history-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-state button {
          margin-top: 12px;
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .error-state button:hover {
          background-color: #2563eb;
        }

        .version-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .version-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .version-item:hover {
          border-color: #3b82f6;
          background-color: #f0f7ff;
        }

        .version-item.latest {
          background-color: #ecfdf5;
          border-color: #10b981;
        }

        .version-info {
          flex: 1;
          min-width: 0;
        }

        .version-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .version-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          background-color: #3b82f6;
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 4px;
        }

        .latest-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          background-color: #10b981;
          color: white;
          font-size: 11px;
          font-weight: 500;
          border-radius: 4px;
        }

        .file-name {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .separator {
          color: #d1d5db;
        }

        .download-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .download-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .download-btn:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

// ==================== HISTORY BUTTON COMPONENT ====================

interface FileHistoryButtonProps {
  /** The document ID (PKSI ID or FS2 ID) */
  documentId: string;
  /** The file type to show history for */
  fileType: string;
  /** Type of document: 'pksi' or 'fs2' */
  documentType: 'pksi' | 'fs2';
  /** Optional: Custom button label */
  label?: string;
  /** Optional: Button size */
  size?: 'small' | 'medium' | 'large';
}

export const FileHistoryButton: React.FC<FileHistoryButtonProps> = ({
  documentId,
  fileType,
  documentType,
  label,
  size = 'small',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    small: 'history-btn-small',
    medium: 'history-btn-medium',
    large: 'history-btn-large',
  };

  return (
    <>
      <button 
        className={`history-btn ${sizeClasses[size]}`}
        onClick={() => setIsModalOpen(true)}
        title="Lihat Riwayat Versi"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.05 11C3.27 7.5 5.54 4.66 8.62 3.51C11.7 2.37 15.15 3.01 17.59 5.13C20.04 7.26 21.05 10.65 20.19 13.81C19.33 16.98 16.71 19.37 13.43 19.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M1 6V1H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 1L6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {label && <span>{label}</span>}
      </button>

      <FileVersionHistory
        documentId={documentId}
        fileType={fileType}
        documentType={documentType}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <style>{`
        .history-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .history-btn:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
          color: #374151;
        }

        .history-btn-small {
          padding: 4px 8px;
          font-size: 12px;
        }

        .history-btn-medium {
          padding: 6px 12px;
          font-size: 14px;
        }

        .history-btn-large {
          padding: 8px 16px;
          font-size: 16px;
        }
      `}</style>
    </>
  );
};

export default FileVersionHistory;
