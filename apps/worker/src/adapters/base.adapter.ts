import * as cheerio from 'cheerio'

export interface AdapterResult {
  success: boolean
  url: string
  title?: string
  price?: number
  currency?: string
  inStock?: boolean
  sizes?: string[]
  image?: string
  error?: string
}

/**
 * Base adapter interface for site-specific parsing
 */
export abstract class BaseAdapter {
  abstract domain: string

  /**
   * Parse the HTML and extract product information
   */
  abstract parse(html: string, url: string): AdapterResult

  /**
   * Helper to extract text from an element
   */
  protected getText($: cheerio.CheerioAPI, selector: string): string | undefined {
    const element = $(selector).first()
    return element.length ? element.text().trim() : undefined
  }

  /**
   * Helper to extract attribute from an element
   */
  protected getAttr(
    $: cheerio.CheerioAPI,
    selector: string,
    attr: string
  ): string | undefined {
    const element = $(selector).first()
    return element.length ? element.attr(attr) : undefined
  }

  /**
   * Helper to extract price from text
   */
  protected extractPrice(text: string): number | undefined {
    if (!text) return undefined

    // Remove currency symbols and extract number
    const matches = text.match(/[\d,]+\.?\d*/g)
    if (matches && matches.length > 0) {
      const priceStr = matches[0].replace(/,/g, '')
      const price = parseFloat(priceStr)
      return isNaN(price) ? undefined : price
    }

    return undefined
  }

  /**
   * Helper to detect currency from text
   */
  protected detectCurrency(text: string): string {
    if (text.includes('$') || text.includes('USD')) return 'USD'
    if (text.includes('€') || text.includes('EUR')) return 'EUR'
    if (text.includes('£') || text.includes('GBP')) return 'GBP'
    if (text.includes('DKK') || text.includes('kr')) return 'DKK'
    if (text.includes('SEK')) return 'SEK'
    return 'USD' // Default
  }
}
