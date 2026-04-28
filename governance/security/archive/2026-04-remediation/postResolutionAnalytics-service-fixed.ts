/**
 * Post-Resolution Analytics Service - PRODUCTION FIXES APPLIED
 * Fixes for expensive variance algorithm and N+1 write pattern
 */

import { pool } from '../../database/connection'
import { logger } from '../../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import type { ResolutionAnalytics, AuthenticatedUser } from '../playbookManagement/types'

export class PostResolutionAnalyticsService {
  /**
   * Analyze resolution and generate analytics
   */
  async analyzeResolution(
    escalationRecordId: string,
    expectedOutcome: Record<string, any>,
    actualOutcome: Record<string, any>,
    user: AuthenticatedUser
  ): Promise<ResolutionAnalytics> {
    logger.info(`📊 Analyzing resolution for escalation record: ${escalationRecordId}`)

    // Get escalation record
    const recordResult = await pool.query(
      "SELECT * FROM playbook_escalation_records WHERE id = $1",
      [escalationRecordId]
    )

    if (recordResult.rows.length === 0) {
      throw new Error('Escalation record not found')
    }

    const escalationRecord = recordResult.rows[0]

    // Calculate variance
    const variance = this.calculateVariance(expectedOutcome, actualOutcome)

    // Extract entities from outcome
    const extractedEntities = this.extractOutcomeEntities(actualOutcome)

    // Detect entity changes
    const entityChanges = this.detectEntityChanges(expectedOutcome, actualOutcome)

    // Generate model update reason
    const modelUpdateRecommended = variance > 0.2
    const modelUpdateReason = modelUpdateRecommended
      ? `Variance of ${(variance * 100).toFixed(2)}% exceeds threshold of 20%`
      : null

    // Generate version update suggestions
    const versionUpdateRecommended = Object.keys(entityChanges).length > 0
    const versionUpdateReason = versionUpdateRecommended
      ? `${Object.keys(entityChanges).length} entity changes detected`
      : null

    // Store analytics
    const analyticsId = uuidv4()
    const result = await pool.query(
      `
      INSERT INTO playbook_resolution_analytics (
        id, escalation_record_id, playbook_id, expected_outcome, actual_outcome,
        outcome_variance, extracted_entities, entity_changes,
        model_update_recommended, model_update_reason,
        version_update_recommended, version_update_reason, analyzed_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [
        analyticsId,
        escalationRecordId,
        escalationRecord.playbook_id,
        JSON.stringify(expectedOutcome),
        JSON.stringify(actualOutcome),
        variance,
        JSON.stringify(extractedEntities),
        JSON.stringify(entityChanges),
        modelUpdateRecommended,
        modelUpdateReason,
        versionUpdateRecommended,
        versionUpdateReason,
        user.id
      ]
    )

    logger.info(`✅ Resolution analysis completed: variance=${(variance * 100).toFixed(2)}%`)
    return result.rows[0]
  }

  /**
   * Calculate variance between expected and actual outcomes
   * FIX #8: Use semantic comparison instead of Levenshtein distance
   * O(n) complexity instead of O(n·m), stable metric
   */
  private calculateVariance(expected: Record<string, any>, actual: Record<string, any>): number {
    // PERFORMANCE FIX #8: Semantic comparison, not string-based
    // This is O(n) instead of O(n·m) and produces stable metrics
    
    // Compare key sets
    const expectedKeys = new Set(Object.keys(expected))
    const actualKeys = new Set(Object.keys(actual))
    
    const addedKeys = [...actualKeys].filter(k => !expectedKeys.has(k)).length
    const removedKeys = [...expectedKeys].filter(k => !actualKeys.has(k)).length
    const commonKeys = [...expectedKeys].filter(k => actualKeys.has(k))
    
    // Compare values for common keys
    let changedValues = 0
    for (const key of commonKeys) {
      if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
        changedValues++
      }
    }
    
    // Calculate variance as ratio of changes
    const totalKeys = Math.max(expectedKeys.size, actualKeys.size)
    if (totalKeys === 0) return 0
    
    const changes = addedKeys + removedKeys + changedValues
    return Math.min(1, changes / totalKeys)
  }

  /**
   * Extract entities from outcome
   */
  private extractOutcomeEntities(outcome: Record<string, any>): Record<string, any> {
    const entities: Record<string, any> = {}

    // Extract roles
    if (outcome.roles) {
      entities.roles = outcome.roles
    }

    // Extract timelines
    if (outcome.timelines) {
      entities.timelines = outcome.timelines
    }

    // Extract risk definitions
    if (outcome.risk_definitions) {
      entities.risk_definitions = outcome.risk_definitions
    }

    // Extract tools
    if (outcome.tools) {
      entities.tools = outcome.tools
    }

    // Extract incident categories
    if (outcome.incident_categories) {
      entities.incident_categories = outcome.incident_categories
    }

    return entities
  }

  /**
   * Detect entity changes between expected and actual
   */
  private detectEntityChanges(expected: Record<string, any>, actual: Record<string, any>): Record<string, any> {
    const changes: Record<string, any> = {}

    // Check for added keys
    const expectedKeys = new Set(Object.keys(expected))
    const actualKeys = new Set(Object.keys(actual))

    for (const key of actualKeys) {
      if (!expectedKeys.has(key)) {
        changes[`added_${key}`] = actual[key]
      }
    }

    // Check for removed keys
    for (const key of expectedKeys) {
      if (!actualKeys.has(key)) {
        changes[`removed_${key}`] = expected[key]
      }
    }

    // Check for modified values
    for (const key of expectedKeys) {
      if (actualKeys.has(key)) {
        if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
          changes[`modified_${key}`] = {
            expected: expected[key],
            actual: actual[key]
          }
        }
      }
    }

    return changes
  }

  /**
   * Store extracted entities in database
   * FIX #9: Use batch INSERT instead of N+1 write pattern
   */
  async storeExtractedEntities(
    playbookId: string,
    versionId: string,
    entities: Array<{
      id: string
      entity_type: string
      entity_name: string
      entity_value: Record<string, any>
      extracted_at: Date
      extraction_confidence: number
      source_section: string
    }>
  ): Promise<void> {
    if (entities.length === 0) return

    // PERFORMANCE FIX #9: Batch insert instead of N+1 writes
    // Single database round trip instead of one per entity
    const values = entities.map((entity, idx) => {
      const paramBase = idx * 9
      return `($${paramBase + 1}, $${paramBase + 2}, $${paramBase + 3}, $${paramBase + 4}, $${paramBase + 5}, $${paramBase + 6}, $${paramBase + 7}, $${paramBase + 8}, $${paramBase + 9})`
    }).join(',')

    const params = entities.flatMap(entity => [
      entity.id,
      playbookId,
      versionId,
      entity.entity_type,
      entity.entity_name,
      JSON.stringify(entity.entity_value),
      entity.extracted_at,
      entity.extraction_confidence,
      entity.source_section
    ])

    await pool.query(
      `INSERT INTO playbook_extracted_entities 
       (id, playbook_id, version_id, entity_type, entity_name, entity_value, 
        extracted_at, extraction_confidence, source_section) 
       VALUES ${values}`,
      params
    )

    logger.info(`✅ Stored ${entities.length} extracted entities in batch`)
  }

  /**
   * Get improvement recommendations
   */
  async getImprovementRecommendations(playbookId: string): Promise<Record<string, string>[]> {
    const result = await pool.query(
      `
      SELECT version_update_suggestions
      FROM playbook_resolution_analytics
      WHERE playbook_id = $1 AND version_update_recommended = true
      ORDER BY analyzed_at DESC
      LIMIT 10
    `,
      [playbookId]
    )

    return result.rows.map(row => row.version_update_suggestions)
  }
}

export const postResolutionAnalyticsService = new PostResolutionAnalyticsService()
