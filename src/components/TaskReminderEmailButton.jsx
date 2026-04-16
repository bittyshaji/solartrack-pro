/**
 * Task Reminder Email Button Component
 * Allows manual triggering of task reminder emails
 * Phase 2B: Email & Notifications
 */

import { useState } from 'react'
import { Mail, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendTaskReminder } from '../lib/stageTaskService'

export default function TaskReminderEmailButton({ taskId, assignedToEmail, taskTitle }) {
  const [loading, setLoading] = useState(false)

  const handleSendReminder = async () => {
    if (!assignedToEmail) {
      toast.error('Assignee email not found')
      return
    }

    setLoading(true)
    try {
      const result = await sendTaskReminder(taskId, [assignedToEmail])

      if (result && result.length > 0) {
        toast.success('Task reminder email queued successfully')
      } else {
        toast.error('Failed to queue task reminder email')
      }
    } catch (error) {
      console.error('Error sending task reminder:', error)
      toast.error('Error sending task reminder email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSendReminder}
      disabled={loading || !assignedToEmail}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        loading || !assignedToEmail
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700'
      }`}
      title={assignedToEmail ? 'Send task reminder to assignee' : 'No assignee email available'}
    >
      {loading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Mail className="w-4 h-4" />
          Send Reminder
        </>
      )}
    </button>
  )
}
