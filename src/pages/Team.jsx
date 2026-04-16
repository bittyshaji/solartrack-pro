/**
 * Team Management Page
 * Manage team members, assignments, and capacity
 */

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import HomeButton from '../components/HomeButton'
import { Users, TrendingUp, Zap, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTeamMembers, getTeamCapacity, getTeamMemberDetail, removeFromProject } from '../lib/teamService'

export default function Team() {
  const [teamMembers, setTeamMembers] = useState([])
  const [capacity, setCapacity] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberDetail, setMemberDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      const [members, capacityData] = await Promise.all([
        getTeamMembers(),
        getTeamCapacity()
      ])

      setTeamMembers(members)
      if (capacityData.success) {
        setCapacity(capacityData)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMember = async (member) => {
    setSelectedMember(member)
    setDetailLoading(true)
    const detail = await getTeamMemberDetail(member.id)
    if (detail.success) {
      setMemberDetail(detail)
    }
    setDetailLoading(false)
  }

  const handleRemoveFromProject = async (assignmentId) => {
    if (!window.confirm('Remove this team member from the project?')) return

    const result = await removeFromProject(assignmentId)
    if (result.success) {
      toast.success('Removed from project')
      if (selectedMember) {
        const detail = await getTeamMemberDetail(selectedMember.id)
        if (detail.success) setMemberDetail(detail)
      }
    } else {
      toast.error('Failed to remove')
    }
  }

  if (loading) {
    return (
      <Layout title="Team Management">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Team Management">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-500">{teamMembers.length} team members</p>
          </div>
          <HomeButton />
        </div>

        {/* Capacity Cards */}
        {capacity && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Users className="text-blue-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Total Team</p>
                  <p className="text-2xl font-bold">{capacity.totalCapacity}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Avg Utilization</p>
                  <p className="text-2xl font-bold">{capacity.avgUtilization}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Zap className="text-yellow-500" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Total Hours (30d)</p>
                  <p className="text-2xl font-bold">{Math.round(capacity.capacity.reduce((sum, m) => sum + m.totalHours, 0))}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Team List */}
          <div className="col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Team Members</h2>
            </div>
            <div className="divide-y">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedMember?.id === member.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{member.full_name}</p>
                      <p className="text-sm text-gray-500">{member.role || 'Team Member'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Detail */}
          <div className="space-y-6">
            {selectedMember && memberDetail ? (
              detailLoading ? (
                <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center min-h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Member Info */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">{memberDetail.member.full_name}</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium">{memberDetail.member.role || 'Team Member'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Hours</p>
                        <p className="text-2xl font-bold">{memberDetail.totalHours.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Projects */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">Assigned Projects ({memberDetail.assignments.length})</h3>
                    {memberDetail.assignments.length > 0 ? (
                      <div className="space-y-3">
                        {memberDetail.assignments.map((assignment) => (
                          <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">{assignment.projects?.name || 'Unknown'}</p>
                              <button
                                onClick={() => handleRemoveFromProject(assignment.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">Role: {assignment.role}</p>
                            <p className="text-xs text-gray-500">Status: {assignment.projects?.status}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not assigned to any projects</p>
                    )}
                  </div>
                </>
              )
            ) : (
              <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500">Select a team member to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
