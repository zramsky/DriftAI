"use client"

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface UsePollingOptions {
  /** Interval in milliseconds */
  interval?: number
  /** Maximum polling duration in milliseconds */
  maxDuration?: number
  /** Function to determine if polling should stop */
  shouldStop?: (data: any) => boolean
}

export function useContractPolling(
  contractId: string | null,
  options: UsePollingOptions = {}
) {
  const {
    interval = 5000, // 5 seconds
    maxDuration = 60000, // 60 seconds
    shouldStop = (data) => data?.processingState === 'completed' || data?.processingState === 'inactive'
  } = options

  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const pollStatus = async () => {
    if (!contractId) return

    try {
      const response = await apiClient.getContractStatus(contractId)
      if (response.data && shouldStop(response.data)) {
        stopPolling()
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
        queryClient.invalidateQueries({ queryKey: ['contracts', contractId] })
      }
    } catch (error) {
      console.error('Error polling contract status:', error)
    }
  }

  const startPolling = () => {
    if (!contractId) return

    // Clear any existing polling
    stopPolling()

    // Start polling
    intervalRef.current = setInterval(pollStatus, interval)

    // Set maximum duration
    timeoutRef.current = setTimeout(() => {
      stopPolling()
    }, maxDuration)

    // Poll immediately
    pollStatus()
  }

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  return { startPolling, stopPolling }
}

export function useInvoicePolling(
  invoiceId: string | null,
  options: UsePollingOptions = {}
) {
  const {
    interval = 5000, // 5 seconds
    maxDuration = 60000, // 60 seconds
    shouldStop = (data) => 
      data?.processingState === 'completed' || 
      data?.processingState === 'flagged' ||
      data?.processingState === 'approved' ||
      data?.processingState === 'rejected'
  } = options

  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const pollStatus = async () => {
    if (!invoiceId) return

    try {
      const response = await apiClient.getInvoiceStatus(invoiceId)
      if (response.data && shouldStop(response.data)) {
        stopPolling()
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      }
    } catch (error) {
      console.error('Error polling invoice status:', error)
    }
  }

  const startPolling = () => {
    if (!invoiceId) return

    // Clear any existing polling
    stopPolling()

    // Start polling
    intervalRef.current = setInterval(pollStatus, interval)

    // Set maximum duration
    timeoutRef.current = setTimeout(() => {
      stopPolling()
    }, maxDuration)

    // Poll immediately
    pollStatus()
  }

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  return { startPolling, stopPolling }
}