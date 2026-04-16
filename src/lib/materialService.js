/**
 * Material Service Library
 * Handles CRUD operations for project materials/deliveries
 */

import { supabase } from './supabase'

/**
 * Add a new material/delivery item to a project
 * @param {string} projectId - Project ID
 * @param {Object} material - Material data {name, quantity, unit_cost, category, description}
 * @returns {Promise<Object>}
 */
export async function addMaterial(projectId, material) {
  try {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        project_id: projectId,
        name: material.name,
        quantity: material.quantity || 1,
        unit_cost: material.unit_cost || 0,
        category: material.category || 'General',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data, message: 'Material added successfully' }
  } catch (error) {
    console.error('Error adding material:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing material
 * @param {string} materialId - Material ID
 * @param {Object} updates - Fields to update {name, quantity, unit_cost, category, description}
 * @returns {Promise<Object>}
 */
export async function updateMaterial(materialId, updates) {
  try {
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', materialId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data, message: 'Material updated successfully' }
  } catch (error) {
    console.error('Error updating material:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a material
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>}
 */
export async function deleteMaterial(materialId) {
  try {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId)

    if (error) throw error
    return { success: true, message: 'Material deleted successfully' }
  } catch (error) {
    console.error('Error deleting material:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all materials for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getMaterialsByProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching materials:', error)
    return []
  }
}
