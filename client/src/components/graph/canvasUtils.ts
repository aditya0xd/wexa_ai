// Professional Canvas node rendering constants
export const NODE_RADIUS = {
  Tier1: 12,
  Tier2: 9,
  Tier3: 7,
  CollateralPool: 6,
} as const

export const STATUS_COLOR = {
  Healthy:  '#10b981', // Professional green
  Stressed: '#f59e0b', // Professional amber
  Defaulted:'#ef4444', // Professional red
} as const

export const EDGE_COLOR = {
  TRADES_WITH:      '#3b82f6', // Blue
  POSTS_COLLATERAL: '#8b5cf6', // Purple
  OWNED_BY:         '#f59e0b', // Amber
} as const

export const HOP_COLOR: Record<number, string> = {
  1: '#ef4444', // Red (Direct)
  2: '#f97316', // Orange
  3: '#f59e0b', // Amber
  4: '#eab308', // Yellow
  5: '#84cc16', // Lime
}

/**
 * Draw a clean, professional single institution/pool node on canvas.
 */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: any,
  isSelected: boolean,
  isDefaulted: boolean,
  hopDistance: number | null,
  globalScale: number,
) {
  const isPool = node.label === 'CollateralPool'
  const tier = node.tier as keyof typeof NODE_RADIUS
  const baseR = isPool ? NODE_RADIUS.CollateralPool : (NODE_RADIUS[tier] ?? NODE_RADIUS.Tier3)
  const r = baseR / globalScale * 1.5

  const statusColor = isDefaulted
    ? STATUS_COLOR.Defaulted
    : hopDistance !== null
    ? HOP_COLOR[Math.min(hopDistance, 5)] ?? '#84cc16'
    : (STATUS_COLOR[node.status as keyof typeof STATUS_COLOR] ?? '#3b82f6')

  const x = node.x ?? 0
  const y = node.y ?? 0

  // ── Highlight Ring ──
  if (isSelected || isDefaulted || hopDistance !== null) {
    ctx.beginPath()
    ctx.arc(x, y, r * 1.4, 0, Math.PI * 2)
    ctx.fillStyle = statusColor + (isSelected ? '40' : '20')
    ctx.fill()
  }

  // ── Node body ──
  ctx.beginPath()
  if (isPool) {
    // Clean diamond for pools
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r, y)
    ctx.lineTo(x, y + r)
    ctx.lineTo(x - r, y)
    ctx.closePath()
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2)
  }

  // Fill: Solid dark background
  ctx.fillStyle = '#1e2233'
  ctx.fill()

  // Border ring
  ctx.strokeStyle = statusColor
  ctx.lineWidth = isSelected ? 3 / globalScale : 2 / globalScale
  ctx.stroke()

  // ── Label ──
  const labelScale = Math.max(0.6, Math.min(1, globalScale))
  const fontSize = (isPool ? 7 : tier === 'Tier1' ? 9 : 8) / globalScale
  ctx.font = `500 ${fontSize}px "Inter", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isSelected || isDefaulted ? '#fff' : '#9ca3af'
  ctx.fillText(
    node.name?.length > 15 ? node.name.slice(0, 14) + '…' : (node.name ?? node.id),
    x,
    y + r + fontSize * 1.5,
  )

  void labelScale
}

/**
 * Draw a relationship edge with professional colored stroke.
 */
export function edgeColor(type: string): string {
  return EDGE_COLOR[type as keyof typeof EDGE_COLOR] ?? 'rgba(255,255,255,0.2)'
}
