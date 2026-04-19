/**
 * Team Service Library
 * Handles team member operations and project assignments
 */

import { supabase } from './supabase'

/**
 * Get all team members
 * @returns {Promise<Array>}
 */
export async function getTeamMembers() {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('full_name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching team members:', error)
    return []
  }
}

/**
 * Get team member detail with projects and hours
 * @param {string} memberId - Team member ID
 * @returns {Promise<Object>}
 */
export async function getTeamMemberDetail(memberId) {
  try {
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError) throw memberError

    // Get assigned projects
    const { data: assignments, error: assignError } = await supabase
      .from('project_assignments')
      .select('*, projects(id, name, status)')
      .eq('team_member_id', memberId)

    if (assignError) console.warn('Assignment fetch warning:', assignError)

    // Get total hours worked (from daily updates)
    const { data: updates, error: updatesError } = await supabase
      .from('daily_updates')
      .select('date, hours_worked')
      .eq('author_id', memberId)

    if (updatesError) console.warn('Updates fetch warning:', updatesError)

    const totalHours = (updates || []).reduce((sum, u) => sum + (u.hours_worked || 0), 0)

    return {
      member,
      assignments: assignments || [],
      totalHours,
      success: true
    }
  } catch (error) {
    console.error('Error fetching team member detail:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Assign team member to project
 * @param {string} projectId - Project ID
 * @param {string} memberId - Team member ID
 * @param {string} role - Role in the project
 * @returns {Promise<Object>}
 */
export async function assignToProject(projectId, memberId, role = 'team_member') {
  try {
    const { data, error } = await supabase
      .from('project_assignments')
      .insert([
        {
          project_id: projectId,
          team_member_id: memberId,
          role,
          assigned_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error assigning to project:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove team member from project
 * @param {string} assignmentId - Assignment ID
 * @returns {Promise<Object>}
 */
export async function removeFromProject(assignmentId) {
  try {
    const { error } = await supabase
      .from('project_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error removing from project:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get team capacity and workload
 * @returns {Promise<Object>}
 */
export async function getTeamCapacity() {
  try {
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, full_name, status')

    if (membersError) throw membersError

    const capacityData = await Promise.all(
      (members || []).map(async (member) => {
        const { data: updates } = await supabase
          .from('daily_updates')
          .select('date, hours_worked')
          .eq('author_id', member.id)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const hoursLast30Days = (updates || []).reduce((sum, u) => sum + (u.hours_worked || 0), 0)
        const avgHoursPerDay = hoursLast30Days / 30

        return {
          id: member.id,
          name: member.full_name,
          status: member.status,
          totalHours: hoursLast30Days,
          avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
          utilizationRate: Math.min(Math.round((avgHoursPerDay / 8) * 100), 100)
        }
      })
    )

    return {
      success: true,
      capacity: capacityData,
      totalCapacity: capacityData.length,
      avgUtilization: Math.round(
        capacityData.reduce((sum, m) => sum + m.utilizationRate, 0) / (capacityData.length || 1)
      )
    }
  } catch (error) {
    console.error('Error fetching team capacity:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get projects assigned to team member
 * @param {string} memberId - Team member ID
 * @returns {Promise<Array>}
 */
export async function getTeamMemberProjects(memberId) {
  try {
    const { data, error } = await supabase
      .from('project_assignments')
      .select('*, projects(id, name, status, stage)')
      .eq('team_member_id', memberId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching team member projects:', error)
    return []
  }
}

/**
 * Get projects and their assigned team
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getProjectTeam(projectId) {
  try {
    const { data, error } = await supabase
      .from('project_assignments')
      .select('*, team_members(id, full_name, role)')
      .eq('project_id', projectId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching project team:', error)
    return []
  }
}
