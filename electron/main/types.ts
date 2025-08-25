export type Metal = 'gold' | 'silver'
export interface MetalDashboard {
  balanceGrams: number
  recent: Array<{ at: string; deltaGrams: number; note?: string }>
}
export type AccessoryFilter = 'available' | 'sold' | 'all'

export interface AccessoryItem {
  id: string
  type: string
  description: string
  price: number
  addedAt: string
  soldAt?: string | null
  soldPrice?: number | null
  sku?: string | null
}
