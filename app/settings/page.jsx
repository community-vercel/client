'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Upload } from 'lucide-react';
import { getSettings, updateSettings } from '../../lib/api';

export default function Settings() {
  const [settings, setSettings] = useState({ siteName: '', phone: '', logo: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await getSettings();
    if (data) setSettings(data);
  };

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
    const data = { siteName: settings.siteName, phone: settings.phone };
    if (logoFile) data.logo = logoFile;
    await updateSettings(data);
    fetchSettings();
    setLogoFile(null);
    setPreviewUrl(null);
  };

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

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-8 space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="space-y-6">
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
                  src={previewUrl || `${settings.logo}`}
                  alt="Logo Preview"
                  className="max-w-[150px] h-auto rounded-lg shadow-md"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Save size={18} />
          Save Settings
        </motion.button>
      </motion.form>
    </div>
  )}