import apiClient from './client'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  JdTemplate,
  CreateTemplateRequest,
  HistorySummary,
  HistoryDetail,
  PagedResponse,
} from '../types'

// ============================================================
// Analysis
// ============================================================

export const analyzeResume = async (request: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const { data } = await apiClient.post<AnalyzeResponse>('/api/analyze', request)
  return data
}

// ============================================================
// Templates
// ============================================================

export const getTemplates = async (): Promise<JdTemplate[]> => {
  const { data } = await apiClient.get<JdTemplate[]>('/api/templates')
  return data
}

export const getTemplate = async (id: string): Promise<JdTemplate> => {
  const { data } = await apiClient.get<JdTemplate>(`/api/templates/${id}`)
  return data
}

export const createTemplate = async (request: CreateTemplateRequest): Promise<JdTemplate> => {
  const { data } = await apiClient.post<JdTemplate>('/api/templates', request)
  return data
}

export const updateTemplate = async (id: string, request: CreateTemplateRequest): Promise<JdTemplate> => {
  const { data } = await apiClient.put<JdTemplate>(`/api/templates/${id}`, request)
  return data
}

export const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/templates/${id}`)
}

// ============================================================
// History
// ============================================================

export const getHistory = async (page = 0, size = 20): Promise<PagedResponse<HistorySummary>> => {
  const { data } = await apiClient.get<PagedResponse<HistorySummary>>('/api/history', {
    params: { page, size },
  })
  return data
}

export const getHistoryDetail = async (id: string): Promise<HistoryDetail> => {
  const { data } = await apiClient.get<HistoryDetail>(`/api/history/${id}`)
  return data
}

export const deleteHistory = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/history/${id}`)
}
