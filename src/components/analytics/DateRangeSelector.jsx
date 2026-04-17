import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

/**
 * DateRangeSelector Component
 * Provides preset date range selections and custom date picker
 * Returns {startDate, endDate} in ISO format
 */
export default function DateRangeSelector({ onSelect, initialStartDate, initialEndDate }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(initialStartDate || '')
  const [customEnd, setCustomEnd] = useState(initialEndDate || '')
  const [selectedPreset, setSelectedPreset] = useState(null)

  const today = new Date()

  const presets = [
    {
      label: 'Today',
      get dates() {
        const date = new Date()
        return {
          startDate: date.toISOString().split('T')[0],
          endDate: date.toISOString().split('T')[0],
        }
      },
    },
    {
      label: 'This Week',
      get dates() {
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay())
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      },
    },
    {
      label: 'This Month',
      get dates() {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      },
    },
    {
      label: 'Last 3 Months',
      get dates() {
        const start = new Date(today)
        start.setMonth(today.getMonth() - 3)
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      },
    },
    {
      label: 'Last Year',
      get dates() {
        const start = new Date(today)
        start.setFullYear(today.getFullYear() - 1)
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }
      },
    },
  ]

  const handlePresetClick = (preset) => {
    const { startDate, endDate } = preset.dates
    setSelectedPreset(preset.label)
    setShowCustom(false)
    onSelect({ startDate, endDate })
  }

  const handleCustomSubmit = () => {
    if (customStart && customEnd) {
      setSelectedPreset(null)
      onSelect({ startDate: customStart, endDate: customEnd })
      setShowCustom(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Date Range:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
              selectedPreset === preset.label
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}

        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1 text-sm font-medium rounded-lg transition flex items-center gap-1 ${
            showCustom
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom
          <ChevronDown
            className={`w-4 h-4 transition ${showCustom ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showCustom && (
        <div className="w-full mt-2 p-4 bg-gray-50 rounded-lg border border-gray-300">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCustomSubmit}
                className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
