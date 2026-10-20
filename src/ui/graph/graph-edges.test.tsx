import { describe, expect, it } from 'vitest'
import type { Connection, Edge } from '@xyflow/react'
import {
  validateConnection,
  wouldCreateCycle,
} from './validation/connection-validator'

describe('Graph Connection & Cycle Validation', () => {
  it('allows valid execution flow connection from exec-out to exec-in', () => {
    const conn: Connection = {
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'exec-out',
      targetHandle: 'exec-in',
    }

    const result = validateConnection(conn, [])
    expect(result.valid).toBe(true)
  })

  it('allows valid texture buffer flow connection from buffer-out to buffer-in', () => {
    const conn: Connection = {
      source: 'static-img-1',
      target: 'frame-buffer-1',
      sourceHandle: 'buffer-out',
      targetHandle: 'buffer-in',
    }

    const result = validateConnection(conn, [])
    expect(result.valid).toBe(true)
  })

  it('rejects mismatched ports between execution and buffer routing', () => {
    const conn1: Connection = {
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'exec-out',
      targetHandle: 'buffer-in',
    }

    const res1 = validateConnection(conn1, [])
    expect(res1.valid).toBe(false)
    expect(res1.reason).toContain('Execution ports')

    const conn2: Connection = {
      source: 'node-1',
      target: 'node-2',
      sourceHandle: 'buffer-out',
      targetHandle: 'exec-in',
    }

    const res2 = validateConnection(conn2, [])
    expect(res2.valid).toBe(false)
    expect(res2.reason).toContain('Texture buffer ports')
  })

  it('rejects self-connection', () => {
    const conn: Connection = {
      source: 'node-1',
      target: 'node-1',
      sourceHandle: 'exec-out',
      targetHandle: 'exec-in',
    }

    const result = validateConnection(conn, [])
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Self-connections')
  })

  it('detects and prevents 2-node direct cycle (A -> B -> A)', () => {
    // Existing edge: node-A -> node-B
    const existingEdges: Edge[] = [
      {
        id: 'e-a-b',
        source: 'node-A',
        target: 'node-B',
        sourceHandle: 'exec-out',
        targetHandle: 'exec-in',
      },
    ]

    // Attempting to connect node-B -> node-A
    const invalidConn: Connection = {
      source: 'node-B',
      target: 'node-A',
      sourceHandle: 'exec-out',
      targetHandle: 'exec-in',
    }

    const result = validateConnection(invalidConn, existingEdges)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('execution loop')
  })

  it('detects and prevents multi-hop cycle (A -> B -> C -> A)', () => {
    const existingEdges: Edge[] = [
      {
        id: 'e-a-b',
        source: 'node-A',
        target: 'node-B',
        sourceHandle: 'exec-out',
        targetHandle: 'exec-in',
      },
      {
        id: 'e-b-c',
        source: 'node-B',
        target: 'node-C',
        sourceHandle: 'exec-out',
        targetHandle: 'exec-in',
      },
    ]

    // Attempting to connect node-C -> node-A
    const invalidConn: Connection = {
      source: 'node-C',
      target: 'node-A',
      sourceHandle: 'exec-out',
      targetHandle: 'exec-in',
    }

    const result = validateConnection(invalidConn, existingEdges)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('execution loop')
  })

  it('allows diamond DAG execution graph without cycles (A -> B, A -> C, B -> D, C -> D)', () => {
    const existingEdges: Edge[] = [
      { id: 'e-1', source: 'A', target: 'B', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
      { id: 'e-2', source: 'A', target: 'C', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
      { id: 'e-3', source: 'B', target: 'D', sourceHandle: 'exec-out', targetHandle: 'exec-in' },
    ]

    // Connecting C -> D is completely valid in a diamond DAG
    const validConn: Connection = {
      source: 'C',
      target: 'D',
      sourceHandle: 'exec-out',
      targetHandle: 'exec-in',
    }

    expect(wouldCreateCycle('C', 'D', existingEdges)).toBe(false)
    const result = validateConnection(validConn, existingEdges)
    expect(result.valid).toBe(true)
  })
})
