/**
 * EmailPreferences Component
 * Customer notification preferences in settings
 * Phase 2B: Email & Notifications
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotificationPreferences, updateNotificationPreferences } from '../lib/notificationService'
import { getEmailLogs } from '../lib/emailService'
import { Mail, Save, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailPreferences({ customerId, onPreferencesChange }) {
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    smsNotifications: false,
    weeklyDigest: true,
    invoiceNotifications: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [customerId])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const prefs = await getNotificationPreferences(customerId)
      setPreferences(prefs)

      // Load notification history
      const logs = await getEmailLogs({
        // Filter by customer - this would need to be adjusted based on your data model
      })
      setNotificationHistory(logs.slice(0, 5)) // Show last 5
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const result = await updateNotificationPreferences(customerId, preferences)

      if (result.success) {
        toast.success('Notification preferences saved')
        if (onPreferencesChange) {
          onPreferencesChange(result.preferences)
        }
      } else {
        toast.error(result.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">Loading preferences...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Go back"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Preferences</h1>
            <p className="text-gray-600 mt-1">Manage your notification settings</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Preferences Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
            </div>

        <div className="space-y-4">
          {/* Email Updates Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Project & Status Updates</h3>
              <p className="text-xs text-gray-600 mt-1">Receive emails about project status changes and updates</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('emailUpdates')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailUpdates ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailUpdates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Invoice Notifications Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Invoice Notifications</h3>
              <p className="text-xs text-gray-600 mt-1">Receive invoice delivery and payment reminders</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('invoiceNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.invoiceNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.invoiceNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Weekly Digest Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Weekly Digest</h3>
              <p className="text-xs text-gray-600 mt-1">Receive a weekly summary of all project activity</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('weeklyDigest')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.weeklyDigest ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS Notifications Toggle (Disabled) */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
              <p className="text-xs text-gray-600 mt-1">Receive text message alerts</p>
              <p className="text-xs text-yellow-600 mt-2 font-medium">Coming soon</p>
            </div>
            <button
              disabled
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 cursor-not-allowed"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Notification History Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showHistory ? 'Hide' : 'Show'}
          </button>
        </div>

        {showHistory && (
          <>
            {notificationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationHistory.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {notification.status === 'sent' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.subject}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${
                      notification.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Privacy Notice</p>
          <p className="text-xs text-blue-700 mt-1">
            We respect your privacy. You can update these preferences at any time, and you can always unsubscribe from emails by clicking the unsubscribe link at the bottom of any email.
          </p>
        </div>
      </div>
    </div>
  )
}
