/**
 * EmailLog Component
 * Admin-only page showing email history and logs
 * Phase 2B: Email & Notifications
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getEmailLogs, resendFailedEmails } from '../lib/emailService'
import { Mail, Download, RotateCcw, Filter, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    emailType: 'all',
    recipient: '',
    dateRange: 'all'
  })
  const [selectedLogs, setSelectedLogs] = useState(new Set())
  const [resending, setResending] = useState(false)

  // Fetch email logs
  useEffect(() => {
    loadEmailLogs()
  }, [filters])

  const loadEmailLogs = async () => {
    setLoading(true)
    try {
      const filterObj = {}

      if (filters.status !== 'all') {
        filterObj.status = filters.status
      }

      if (filters.recipient) {
        filterObj.recipient = filters.recipient
      }

      if (filters.dateRange !== 'all') {
        const now = new Date()
        const start = new Date()

        switch (filters.dateRange) {
          case '1day':
            start.setDate(now.getDate() - 1)
            break
          case '7days':
            start.setDate(now.getDate() - 7)
            break
          case '30days':
            start.setDate(now.getDate() - 30)
            break
          case '90days':
            start.setDate(now.getDate() - 90)
            break
        }

        filterObj.dateRange = { start, end: now }
      }

      const data = await getEmailLogs(filterObj)
      setLogs(data)
    } catch (error) {
      console.error('Error loading email logs:', error)
      toast.error('Failed to load email logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setSelectedLogs(new Set())
  }

  const toggleLogSelection = (logId) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(logId)) {
      newSelected.delete(logId)
    } else {
      newSelected.add(logId)
    }
    setSelectedLogs(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(logs.map(log => log.id)))
    }
  }

  const handleResendFailed = async () => {
    if (selectedLogs.size === 0) {
      toast.error('Please select emails to resend')
      return
    }

    setResending(true)
    try {
      const result = await resendFailedEmails(selectedLogs.size)
      toast.success(`${result.resent} emails resent, ${result.stillFailed} still failing`)
      setSelectedLogs(new Set())
      loadEmailLogs()
    } catch (error) {
      console.error('Error resending emails:', error)
      toast.error('Failed to resend emails')
    } finally {
      setResending(false)
    }
  }

  const handleExportCSV = () => {
    const csv = [
      ['Recipient', 'Type', 'Status', 'Subject', 'Sent At', 'Error'],
      ...logs.map(log => [
        log.recipient,
        log.email_type,
        log.status,
        log.subject,
        log.sent_at ? new Date(log.sent_at).toLocaleString() : '-',
        log.error_message || '-'
      ])
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Email logs exported to CSV')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Mail className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Logs</h1>
          <p className="text-gray-600">Monitor and manage email notifications</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Email Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.emailType}
                onChange={(e) => handleFilterChange('emailType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="invoice">Invoice</option>
                <option value="reminder">Reminder</option>
                <option value="status_update">Status Update</option>
                <option value="welcome">Welcome</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="1day">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>

            {/* Recipient Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
              <input
                type="email"
                placeholder="Search email..."
                value={filters.recipient}
                onChange={(e) => handleFilterChange('recipient', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-2 justify-between items-center">
          <div className="flex gap-2">
            {selectedLogs.size > 0 && (
              <>
                <button
                  onClick={handleResendFailed}
                  disabled={resending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  {resending ? 'Resending...' : `Resend (${selectedLogs.size})`}
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Email Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Loading email logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No email logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLogs.size === logs.length && logs.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Recipient</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sent At</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr
                        key={log.id}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLogs.has(log.id)}
                            onChange={() => toggleLogSelection(log.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">{log.recipient}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {log.email_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">{log.subject}</td>
                        <td className="px-6 py-3 text-sm">{getStatusBadge(log.status)}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {log.error_message ? (
                            <span className="text-red-600 text-xs" title={log.error_message}>
                              {log.error_message.substring(0, 30)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Info */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                Showing {logs.length} email{logs.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
