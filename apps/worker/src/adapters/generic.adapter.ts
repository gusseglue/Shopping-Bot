import * as cheerio from 'cheerio'
import { BaseAdapter, AdapterResult } from './base.adapter'

/**
 * Generic adapter that attempts to extract product information
 * from any website using common patterns and structured data
 */
export class GenericAdapter extends BaseAdapter {
  domain = '*'

  parse(html: string, url: string): AdapterResult {
    if (!html || html === '') {
      // Empty HTML means 304 Not Modified - return success with no changes
      return {
        success: true,
        url,
      }
    }

    try {
      const $ = cheerio.load(html)

      // Try to extract structured data (JSON-LD) first
      const structuredData = this.extractJsonLd($)
      if (structuredData) {
        return {
          success: true,
          url,
          ...structuredData,
        }
      }

      // Fall back to meta tags and common patterns
      const result: AdapterResult = {
        success: true,
        url,
      }

      // Extract title
      result.title = this.extractTitle($)

      // Extract price
      const priceData = this.extractPrice($)
      if (priceData) {
        result.price = priceData.price
        result.currency = priceData.currency
      }

      // Extract stock status
      result.inStock = this.extractStockStatus($)

      // Extract image
      result.image = this.extractImage($)

      return result
    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : 'Parse failed',
      }
    }
  }

  /**
   * Extract product data from JSON-LD structured data
   */
  private extractJsonLd($: cheerio.CheerioAPI): Partial<AdapterResult> | null {
    const scripts = $('script[type="application/ld+json"]')

    for (let i = 0; i < scripts.length; i++) {
      try {
        const json = JSON.parse($(scripts[i]).html() || '{}')
        
        // Handle @graph array
        const items = json['@graph'] || [json]
        
        for (const item of items) {
          if (item['@type'] === 'Product') {
            const result: Partial<AdapterResult> = {
              title: item.name,
              image: this.extractImageFromJsonLd(item.image),
            }

            // Extract price from offers
            const offers = item.offers
            if (offers) {
              const offer = Array.isArray(offers) ? offers[0] : offers
              result.price = parseFloat(offer.price)
              result.currency = offer.priceCurrency
              result.inStock =
                offer.availability?.includes('InStock') ||
                offer.availability?.includes('LimitedAvailability')
            }

            return result
          }
        }
      } catch {
        // Continue to next script
      }
    }

    return null
  }

  /**
   * Extract title from various sources
   */
  private extractTitle($: cheerio.CheerioAPI): string | undefined {
    // Try common product title selectors
    const selectors = [
      '[data-testid="product-title"]',
      '[data-product-title]',
      '.product-title',
      '.product-name',
      '.product__title',
      'h1.title',
      'h1[itemprop="name"]',
      '#productTitle',
      'h1',
    ]

    for (const selector of selectors) {
      const title = this.getText($, selector)
      if (title && title.length > 0 && title.length < 500) {
        return title
      }
    }

    // Fall back to meta tags
    return (
      this.getAttr($, 'meta[property="og:title"]', 'content') ||
      this.getAttr($, 'meta[name="twitter:title"]', 'content') ||
      this.getText($, 'title')
    )
  }

  /**
   * Extract price from various sources
   */
  private extractPrice($: cheerio.CheerioAPI): { price: number; currency: string } | null {
    // Try common price selectors
    const selectors = [
      '[data-testid="price"]',
      '[data-price]',
      '.product-price',
      '.price-current',
      '.price',
      '[itemprop="price"]',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price-whole',
    ]

    for (const selector of selectors) {
      const text = this.getText($, selector)
      if (text) {
        const price = this.extractPriceValue(text)
        if (price !== undefined) {
          return {
            price,
            currency: this.detectCurrency(text),
          }
        }
      }
    }

    // Try data attributes
    const priceAttr = this.getAttr($, '[data-price]', 'data-price')
    if (priceAttr) {
      const price = parseFloat(priceAttr)
      if (!isNaN(price)) {
        return { price, currency: 'USD' }
      }
    }

    // Try meta tags
    const metaPrice = this.getAttr($, 'meta[property="product:price:amount"]', 'content')
    if (metaPrice) {
      const price = parseFloat(metaPrice)
      if (!isNaN(price)) {
        const currency =
          this.getAttr($, 'meta[property="product:price:currency"]', 'content') || 'USD'
        return { price, currency }
      }
    }

    return null
  }

  /**
   * Extract stock status
   */
  private extractStockStatus($: cheerio.CheerioAPI): boolean | undefined {
    // Check common out of stock indicators
    const outOfStockSelectors = [
      '.out-of-stock',
      '.sold-out',
      '.unavailable',
      '[data-out-of-stock]',
      '#outOfStock',
    ]

    for (const selector of outOfStockSelectors) {
      if ($(selector).length > 0) {
        return false
      }
    }

    // Check for in stock indicators
    const inStockSelectors = [
      '.in-stock',
      '.available',
      '[data-in-stock]',
      '#availability:contains("In Stock")',
    ]

    for (const selector of inStockSelectors) {
      if ($(selector).length > 0) {
        return true
      }
    }

    // Check availability text
    const availabilityText = this.getText($, '#availability')?.toLowerCase()
    if (availabilityText) {
      if (
        availabilityText.includes('in stock') ||
        availabilityText.includes('available')
      ) {
        return true
      }
      if (
        availabilityText.includes('out of stock') ||
        availabilityText.includes('unavailable')
      ) {
        return false
      }
    }

    return undefined
  }

  /**
   * Extract main product image
   */
  private extractImage($: cheerio.CheerioAPI): string | undefined {
    // Try common image selectors
    const selectors = [
      '[data-testid="product-image"] img',
      '.product-image img',
      '.product__image img',
      '#landingImage',
      '[itemprop="image"]',
    ]

    for (const selector of selectors) {
      const src = this.getAttr($, selector, 'src')
      if (src) return src
    }

    // Try meta tags
    return this.getAttr($, 'meta[property="og:image"]', 'content')
  }

  /**
   * Extract image URL from JSON-LD image property
   */
  private extractImageFromJsonLd(image: unknown): string | undefined {
    if (typeof image === 'string') return image
    if (Array.isArray(image) && image.length > 0) {
      return typeof image[0] === 'string' ? image[0] : image[0]?.url
    }
    if (typeof image === 'object' && image !== null) {
      return (image as Record<string, string>).url
    }
    return undefined
  }

  /**
   * Extract price value from text
   */
  private extractPriceValue(text: string): number | undefined {
    // Remove whitespace and common text
    const cleaned = text
      .replace(/\s+/g, '')
      .replace(/,/g, '.')
      .replace(/[^\d.]/g, ' ')
      .trim()

    // Extract first number
    const match = cleaned.match(/(\d+\.?\d*)/)?.[1]
    if (match) {
      const price = parseFloat(match)
      if (!isNaN(price) && price > 0) {
        return price
      }
    }

    return undefined
  }
}
