'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

export default function AuditLogViewer({ itemId }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuditLogs();
  }, [page, itemId]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, entityId: itemId },
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch audit logs', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Audit Logs</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : logs.length === 0 ? (
        <div>No audit logs found.</div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log._id} className="p-4 bg-gray-100 rounded-md">
              <p><strong>Action:</strong> {log.action}</p>
              <p><strong>User:</strong> {log.userId?.username || 'Unknown'}</p>
              <p><strong>Time:</strong> {new Date(log.createdAt).toLocaleString()}</p>
              {log.changes && (
                <div>
                  <strong>Changes:</strong>
                  <pre className="text-sm">{JSON.stringify(log.changes, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page * 10 >= total}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}