/**
 * Invoice Email Button Component
 * Allows manual triggering of invoice emails
 * Phase 2B: Email & Notifications
 */

import { useState } from 'react'
import { Mail, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendInvoiceEmail } from '../lib/invoiceService'

export default function InvoiceEmailButton({ invoiceId, customerEmail, invoiceNumber }) {
  const [loading, setLoading] = useState(false)

  const handleSendEmail = async () => {
    if (!customerEmail) {
      toast.error('Customer email not found')
      return
    }

    setLoading(true)
    try {
      const result = await sendInvoiceEmail(invoiceId, customerEmail)

      if (result) {
        toast.success(`Invoice email queued successfully`)
      } else {
        toast.error('Failed to queue invoice email')
      }
    } catch (error) {
      console.error('Error sending invoice email:', error)
      toast.error('Error sending invoice email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSendEmail}
      disabled={loading || !customerEmail}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        loading || !customerEmail
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
      }`}
      title={customerEmail ? 'Send invoice email to customer' : 'No customer email available'}
    >
      {loading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="w-4 h-4" />
          Send Invoice Email
        </>
      )}
    </button>
  )
}
