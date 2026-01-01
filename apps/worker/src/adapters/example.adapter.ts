import { BaseAdapter, AdapterResult } from './base.adapter'

/**
 * Demo adapter for example.com (mock data for testing)
 * This adapter returns randomized data for testing purposes
 */
export class ExampleAdapter extends BaseAdapter {
  domain = 'example.com'

  parse(html: string, url: string): AdapterResult {
    // For demo purposes, we'll return mock data based on the URL
    // In production, you would never do this - always parse real HTML

    // Extract product ID from URL for consistent mock data
    const productMatch = url.match(/product\/([^/?]+)/)
    const productId = productMatch ? productMatch[1] : 'unknown'

    // Generate deterministic but varying data based on product ID
    const hash = this.simpleHash(productId)
    
    // Simulate different products
    const products: Record<string, { title: string; basePrice: number }> = {
      'demo-sneakers': { title: 'Demo Sneakers Pro Max', basePrice: 99.99 },
      'demo-jacket': { title: 'Demo Winter Jacket', basePrice: 149.99 },
      'demo-watch': { title: 'Demo Smart Watch', basePrice: 299.99 },
    }

    const product = products[productId] || { title: `Product ${productId}`, basePrice: 79.99 }

    // Simulate price fluctuation (±10%)
    const priceVariation = ((hash % 21) - 10) / 100 // -10% to +10%
    const price = Math.round(product.basePrice * (1 + priceVariation) * 100) / 100

    // Simulate stock status (80% chance in stock)
    const inStock = hash % 10 < 8

    // Simulate available sizes
    const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const availableSizes = allSizes.filter((_, i) => (hash + i) % 3 !== 0)

    return {
      success: true,
      url,
      title: product.title,
      price,
      currency: 'USD',
      inStock,
      sizes: availableSizes,
      image: `https://example.com/images/${productId}.jpg`,
    }
  }

  /**
   * Simple hash function for generating deterministic but varying data
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
}
