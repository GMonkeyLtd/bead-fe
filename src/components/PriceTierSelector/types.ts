export interface PriceTier {
  id: string
  title: string
  description: string
  price: number
  isRecommended?: boolean
  isHighEnd?: boolean
}
