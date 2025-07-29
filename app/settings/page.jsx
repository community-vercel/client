'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Upload } from 'lucide-react';
import { getSettings, updateSettings } from '../../lib/api';
import api from '../../lib/api';

export default function Settings() {
  // State declarations - organized by functionality
  const [settings, setSettings] = useState({ 
    siteName: '', 
    phone: '', 
    logo: '' 
  });
  
  // Logo upload states
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // UI feedback states
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Backup functionality states
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [backupStatus, setBackupStatus] = useState(null);

  // Effects
  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, []);

  // API Functions
  const fetchSettings = async () => {
    try {
      const { data } = await getSettings();
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to fetch settings');
    }
  };

  const fetchBackups = async () => {
    try {
      const backupsRes = await api.get('/backup/list');
      setBackups(backupsRes.data.backups || []);
    } catch (error) {
      const errorMessage = error.response?.status === 404
        ? 'Backup endpoint not found. Please check the backend configuration.'
        : error.response?.data?.message || 'Failed to fetch backups.';
      setError(errorMessage);
      console.error('Error fetching backups:', error);
    }
  };

  // Event Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const data = { 
        siteName: settings.siteName, 
        phone: settings.phone 
      };
      
      if (logoFile) data.logo = logoFile;
      
      await updateSettings(data);
      setMessage('Settings updated successfully!');
      
      // Refresh settings and reset form
      await fetchSettings();
      setLogoFile(null);
      setPreviewUrl(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('Failed to update settings. Please try again.');
      setTimeout(() => setMessage(null), 3000);
      console.error('Settings update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupStatus(null);
      setIsLoading(true);
      
      const response = await api.post('/backup/create');
      setBackupStatus({ 
        type: 'success', 
        message: `Backup created: ${response.data.filename}` 
      });
      
      // Refresh backup list
      await fetchBackups();
    } catch (error) {
      setBackupStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to create backup' 
      });
      console.error('Backup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) {
      setBackupStatus({ 
        type: 'error', 
        message: 'Please select a backup to restore' 
      });
      return;
    }
    
    if (!confirm('Restoring a backup will overwrite the current database. Continue?')) {
      return;
    }
    
    try {
      setBackupStatus(null);
      setIsLoading(true);
      
      const response = await api.post('/backup/restore', { 
        filename: selectedBackup 
      });
      
      setBackupStatus({ 
        type: 'success', 
        message: response.data.message 
      });
    } catch (error) {
      setBackupStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to restore backup' 
      });
      console.error('Restore error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Component
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex flex-col items-center py-28 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.h1
        className="text-4xl font-extrabold text-white mb-8 tracking-tight drop-shadow-md"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        Site Settings
      </motion.h1>

      {/* Success/Error Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className={`w-full max-w-lg p-4 mb-4 rounded-lg text-white text-center ${
              message.includes('successfully') ? 'bg-green-600' : 'bg-red-600'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="w-full max-w-lg p-4 mb-4 rounded-lg text-white text-center bg-red-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form Container */}
      <motion.div
        className="w-full max-w-lg bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          {/* Site Name Input */}
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              id="siteName"
              type="text"
              placeholder="Enter site name"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="text"
              placeholder="Enter phone number"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
              Site Logo
            </label>
            <div className="relative">
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="logo"
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-300"
              >
                <Upload size={20} className="text-indigo-600 mr-2" />
                <span className="text-gray-600">
                  {logoFile ? logoFile.name : 'Choose an image'}
                </span>
              </label>
            </div>
          </div>

          {/* Logo Preview */}
          <AnimatePresence>
            {(previewUrl || settings.logo) && (
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={previewUrl || settings.logo}
                  alt="Logo Preview"
                  className="max-w-[150px] h-auto rounded-lg shadow-md"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
          >
            <Save size={18} />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </form>

        {/* Database Backup Section */}
        <div className="bg-indigo-50 p-4 rounded-lg shadow-sm border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-indigo-800 mb-3">Database Backup</h4>
          
          <div className="flex flex-col gap-4">
            {/* Create Backup Button */}
            <button
              onClick={handleCreateBackup}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition"
              aria-label="Create Database Backup"
            >
              {isLoading ? 'Creating...' : 'Create Backup'}
            </button>
            
            {/* Restore Backup Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <select
                value={selectedBackup}
                onChange={(e) => setSelectedBackup(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg w-full max-w-xs"
                aria-label="Select Backup to Restore"
              >
                <option value="">Select a backup</option>
                {backups.map((backup) => (
                  <option key={backup.filename} value={backup.filename}>
                    {backup.filename} ({new Date(backup.createdAt).toLocaleString('en-US', { 
                      timeZone: 'Asia/Karachi' 
                    })})
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleRestoreBackup}
                disabled={!selectedBackup || isLoading}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedBackup && !isLoading
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                aria-label="Restore Database Backup"
              >
                {isLoading ? 'Restoring...' : 'Restore Backup'}
              </button>
            </div>
            
            {/* Backup Status Message */}
            {backupStatus && (
              <motion.p
                className={`text-sm ${backupStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {backupStatus.message}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}