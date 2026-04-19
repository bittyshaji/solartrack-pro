/**
 * ProjectCreationGuard Component
 * Prevents users from accessing project creation if no customers exist
 * Enforces customer-first workflow
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { getCustomerCount } from '../../lib/customerService'

export function ProjectCreationGuard({ children }) {
  const navigate = useNavigate()
  const [customerCount, setCustomerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCustomers()
  }, [])

  const checkCustomers = async () => {
    setLoading(true)
    try {
      const count = await getCustomerCount()
      setCustomerCount(count)
    } catch (err) {
      console.error('Error checking customer count:', err)
      setCustomerCount(0)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Checking requirements...</p>
        </div>
      </div>
    )
  }

  if (customerCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Alert Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
              <div className="flex items-start gap-4">
                <AlertCircle size={32} className="flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Create a Customer First
                  </h2>
                  <p className="text-orange-50">
                    Every project must be linked to a customer
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  ✅ Here's what you need to do:
                </h3>
                <ol className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0">
                      1
                    </span>
                    <span>Go to the Customers section</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0">
                      2
                    </span>
                    <span>Create at least one customer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex-shrink-0">
                      3
                    </span>
                    <span>Then you can create projects</span>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  💡 <strong>Why?</strong> This ensures every project is properly associated with a customer, making it easier to manage and track work.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/customers')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold"
              >
                <span>Go to Customers</span>
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                You'll have full access to project creation once you've created a customer.
              </p>
            </div>
          </div>

          {/* Secondary Info */}
          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>👥 Customer-First Workflow</p>
          </div>
        </div>
      </div>
    )
  }

  // Customers exist, render children
  return children
}

export default ProjectCreationGuard
