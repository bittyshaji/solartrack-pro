/**
 * CustomerSelector Component
 * Reusable dropdown for selecting or creating customers
 * REQUIRED for project creation in customer-first workflow
 */

import React, { useState, useEffect } from 'react'
import { Search, Plus, ChevronDown, X } from 'lucide-react'
import { getAllCustomers, searchCustomers } from '../../lib/customerService'

export function CustomerSelector({
  value,
  onChange,
  onCreateNew,
  required = false,
  error = null,
  disabled = false,
  label = 'Customer'
}) {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load customers on mount
  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const data = await getAllCustomers()
      setCustomers(data)
      setFilteredCustomers(data)
    } catch (err) {
      console.error('Error loading customers:', err)
      setFilteredCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (term) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setFilteredCustomers(customers)
    } else {
      try {
        const results = await searchCustomers(term)
        setFilteredCustomers(results)
      } catch (err) {
        console.error('Error searching customers:', err)
        setFilteredCustomers([])
      }
    }
  }

  const handleSelect = (customerId) => {
    onChange(customerId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  const selectedCustomer = customers.find(c => c.customer_id === value)

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {/* Input field */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={selectedCustomer ? '' : 'Search or select a customer...'}
            value={searchTerm || selectedCustomer?.name || ''}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            } ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
          />

          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-10 p-1 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X size={18} />
            </button>
          )}

          {/* Dropdown indicator */}
          <ChevronDown
            size={18}
            className={`absolute right-3 text-gray-400 pointer-events-none transition ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header with create button */}
            <div className="border-b bg-gray-50 p-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onCreateNew?.()
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex-1 text-left"
              >
                <Plus size={16} /> New Customer
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer list */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  <span className="ml-2">Loading customers...</span>
                </div>
              ) : filteredCustomers.length > 0 ? (
                <div className="divide-y">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => handleSelect(customer.customer_id)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
                        value === customer.customer_id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{customer.customer_id}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="mb-3">No customers found</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onCreateNew?.()
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} /> Create New Customer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-sm mt-1 flex items-start">
        <span className="mr-1">⚠️</span>
        {error}
      </p>}

      {/* Helper text */}
      {!error && required && (
        <p className="text-gray-500 text-xs mt-1">
          👤 Select an existing customer or create a new one
        </p>
      )}
    </div>
  )
}

export default CustomerSelector
