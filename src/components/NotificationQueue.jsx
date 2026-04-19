/**
 * NotificationQueue Component
 * Shows pending email notifications and queue status
 * Phase 2B: Email & Notifications
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotificationQueue, sendEmailViaResend, markEmailSent } from '../lib/emailService'
import { Mail, Send, Trash2, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationQueue({ onRefresh }) {
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load queue on mount and set up auto-refresh
  useEffect(() => {
    loadQueue()

    let interval = null
    if (autoRefresh) {
      interval = setInterval(loadQueue, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadQueue = async () => {
    try {
      const data = await getNotificationQueue()
      setQueue(data || [])

      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error loading notification queue:', error)
      toast.error('Failed to load notification queue')
    } finally {
      setLoading(false)
    }
  }

  const handleSendNow = async (itemId) => {
    const item = queue.find(q => q.id === itemId)
    if (!item) return

    setSending(true)
    try {
      const result = await sendEmailViaResend(
        item.recipient,
        item.subject,
        item.html_body,
        item.email_type,
        {
          projectId: item.related_project_id,
          invoiceId: item.related_invoice_id,
          taskId: item.related_task_id
        }
      )

      if (result.success) {
        await markEmailSent(itemId, result.messageId)
        toast.success(`Email sent to ${item.recipient}`)
        loadQueue()
      } else {
        toast.error(`Failed to send email: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleSendSelected = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select emails to send')
      return
    }

    setSending(true)
    let sent = 0
    let failed = 0

    try {
      for (const itemId of selectedItems) {
        const item = queue.find(q => q.id === itemId)
        if (!item) continue

        const result = await sendEmailViaResend(
          item.recipient,
          item.subject,
          item.html_body,
          item.email_type,
          {
            projectId: item.related_project_id,
            invoiceId: item.related_invoice_id,
            taskId: item.related_task_id
          }
        )

        if (result.success) {
          await markEmailSent(itemId, result.messageId)
          sent++
        } else {
          failed++
        }
      }

      toast.success(`${sent} email${sent !== 1 ? 's' : ''} sent, ${failed} failed`)
      setSelectedItems(new Set())
      loadQueue()
    } catch (error) {
      console.error('Error sending selected emails:', error)
      toast.error('Error sending selected emails')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return

    try {
      // In a real app, you'd call a delete function here
      // For now, we'll just remove from UI
      setQueue(queue.filter(q => q.id !== itemId))
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const toggleSelection = (itemId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === queue.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(queue.map(q => q.id)))
    }
  }

  const getScheduledTime = (scheduledAt) => {
    const date = new Date(scheduledAt)
    const now = new Date()

    if (date <= now) {
      return 'Ready to send'
    }

    const diff = date.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `In ${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `In ${minutes}m`
    } else {
      return 'Now'
    }
  }

  const getEmailTypeColor = (type) => {
    const colors = {
      invoice: 'bg-blue-100 text-blue-800',
      reminder: 'bg-purple-100 text-purple-800',
      status_update: 'bg-green-100 text-green-800',
      welcome: 'bg-pink-100 text-pink-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">{queue.length} pending email{queue.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Queue</h2>
              <p className="text-sm text-gray-600">
                {queue.length} pending email{queue.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadQueue}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-yellow-600">{queue.length}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-blue-600">
            {queue.filter(q => getScheduledTime(q.scheduled_at) === 'Ready to send').length}
          </p>
          <p className="text-sm text-blue-600">Ready to Send</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-2xl font-bold text-purple-600">
            {queue.reduce((sum, q) => sum + (q.retry_count || 0), 0)}
          </p>
          <p className="text-sm text-purple-600">Retries</p>
        </div>
      </div>

      {/* Actions */}
      {queue.length > 0 && (
        <div className="flex gap-2 mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={toggleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {selectedItems.size === queue.length ? 'Deselect All' : 'Select All'}
          </button>

          {selectedItems.size > 0 && (
            <button
              onClick={handleSendSelected}
              disabled={sending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : `Send (${selectedItems.size})`}
            </button>
          )}
        </div>
      )}

      {/* Queue List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p>Loading queue...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Queue is empty</p>
          <p className="text-sm">All notifications have been sent</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleSelection(item.id)}
                className="rounded border-gray-300"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getEmailTypeColor(item.email_type)}`}>
                    {item.email_type}
                  </span>
                  <span className="text-xs text-gray-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {getScheduledTime(item.scheduled_at)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{item.subject}</p>
                <p className="text-xs text-gray-600">{item.recipient}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendNow(item.id)}
                  disabled={sending}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Send now"
                >
                  <Send className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
