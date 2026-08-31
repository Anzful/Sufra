function channelLuminance(channel: number): number {
  const normalized = channel / 255
  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '')
  const expanded =
    value.length === 3
      ? value
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : value

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Expected a 3- or 6-digit hex color, received "${hex}"`)
  }

  const red = channelLuminance(Number.parseInt(expanded.slice(0, 2), 16))
  const green = channelLuminance(Number.parseInt(expanded.slice(2, 4), 16))
  const blue = channelLuminance(Number.parseInt(expanded.slice(4, 6), 16))

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}
