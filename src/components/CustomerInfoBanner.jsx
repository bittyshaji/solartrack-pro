/**
 * Customer Information Banner
 * Displays customer details in a thin, elegant banner below project header
 * Shows: name, email, phone, location, company
 */

import { Users, Mail, Phone, MapPin, Building } from 'lucide-react'

export default function CustomerInfoBanner({ customer }) {
  if (!customer) return null

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-sm">
          {/* Customer Name */}
          {customer.name && (
            <div className="flex items-start gap-2">
              <Users size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Customer</p>
                <p className="font-semibold text-slate-900 truncate">{customer.name}</p>
              </div>
            </div>
          )}

          {/* Email */}
          {customer.email && (
            <div className="flex items-start gap-2">
              <Mail size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Email</p>
                <a href={`mailto:${customer.email}`} className="text-slate-700 hover:text-blue-600 truncate">
                  {customer.email}
                </a>
              </div>
            </div>
          )}

          {/* Phone */}
          {customer.phone && (
            <div className="flex items-start gap-2">
              <Phone size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Phone</p>
                <a href={`tel:${customer.phone}`} className="text-slate-700 hover:text-blue-600">
                  {customer.phone}
                </a>
              </div>
            </div>
          )}

          {/* Location */}
          {(customer.city || customer.state) && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Location</p>
                <p className="text-slate-700 truncate">
                  {customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}
                </p>
              </div>
            </div>
          )}

          {/* Company */}
          {customer.company && (
            <div className="flex items-start gap-2">
              <Building size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Company</p>
                <p className="text-slate-700 truncate">{customer.company}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
