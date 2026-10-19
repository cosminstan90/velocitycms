import { ImageResponse } from 'next/og'

export const alt = 'DiVet: Enciclopedia animalelor din România'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Singurul loc din cod unde culorile sunt valori literale: ImageResponse (satori)
// nu rezolva clase Tailwind sau variabile CSS. Valorile sunt copiate din tokenii
// --color-dv-* din app/globals.css (bg, accent, accent-hover, ink-muted).
const DV = {
  bg: '#FBFCFD', // --color-dv-bg
  accent: '#0C5C5C', // --color-dv-accent
  accentHover: '#073E3E', // --color-dv-accent-hover
  inkMuted: '#5B6E78', // --color-dv-ink-muted
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: DV.bg,
          borderLeft: `24px solid ${DV.accent}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 220,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: DV.accent,
          }}
        >
          DiVet
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 52,
            lineHeight: 1.2,
            color: DV.inkMuted,
          }}
        >
          Enciclopedia animalelor din România
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 56,
            width: 160,
            height: 8,
            borderRadius: 4,
            background: DV.accentHover,
          }}
        />
      </div>
    ),
    { ...size },
  )
}
