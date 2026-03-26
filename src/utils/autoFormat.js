/**
 * Auto-format snake_case strings globally.
 * 
 * Add this ONE line to your src/main.jsx:
 * 
 *   import './utils/autoFormat'
 * 
 * That's it. No changes to any page files needed.
 * It patches React's createElement so any string that looks like 
 * "word_word" gets auto-formatted to "Word Word" when rendered.
 */

// Store original
const originalCreateElement = window.__REACT_CREATE_ELEMENT_ORIGINAL || null

// Special acronyms to preserve
const SPECIAL = { ndis: 'NDIS', id: 'ID', gps: 'GPS', sil: 'SIL', sda: 'SDA', ndia: 'NDIA', abn: 'ABN', csv: 'CSV', pdf: 'PDF', api: 'API', url: 'URL' }

function formatSnake(str) {
  if (typeof str !== 'string') return str
  // Only format strings that contain underscores between word chars
  // Skip URLs, emails, CSS values, classNames, etc.
  if (!str.match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)+$/)) return str
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w+/g, w => {
      const l = w.toLowerCase()
      return SPECIAL[l] || (l.charAt(0).toUpperCase() + l.slice(1))
    })
}

// CSS class to mark elements we should auto-format
// Add class="auto-format" or data-format to any container
// OR just use the MutationObserver approach below

// Simple approach: MutationObserver that watches for text nodes
function autoFormatTextNodes() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const formatted = formatSnake(node.textContent.trim())
            if (formatted !== node.textContent.trim() && formatted !== node.textContent) {
              // Only replace if the ENTIRE text content is a snake_case value
              // This prevents breaking sentences that happen to contain underscores
              if (node.textContent.trim().match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)+$/)) {
                node.textContent = node.textContent.replace(node.textContent.trim(), formatted)
              }
            }
          }
          // Also check element's direct text
          if (node.nodeType === Node.ELEMENT_NODE) {
            formatElement(node)
          }
        })
      }
    }
  })

  function formatElement(el) {
    // Skip script, style, input, textarea, code elements
    const skip = ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'CODE', 'PRE', 'SVG']
    if (skip.includes(el.tagName)) return

    el.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim()
        if (text.match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)+$/)) {
          child.textContent = child.textContent.replace(text, formatSnake(text))
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        formatElement(child)
      }
    })
  }

  // Initial pass on existing content
  formatElement(document.body)

  // Watch for future changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoFormatTextNodes)
} else {
  autoFormatTextNodes()
}