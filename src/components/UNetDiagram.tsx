/* Architecture sketch of the UNet exactly as implemented in my Part B notebook. */

interface Block {
  x: number
  y: number
  w: number
  h: number
  label: string
  shape: string
  tone?: 'down' | 'up' | 'mid' | 'io'
}

const B: Record<string, Block> = {
  input: { x: 10, y: 34, w: 74, h: 40, label: 'input', shape: '1 × 28 × 28', tone: 'io' },
  convIn: { x: 110, y: 34, w: 96, h: 40, label: 'ConvBlock', shape: 'D × 28 × 28' },
  down1: { x: 150, y: 120, w: 96, h: 40, label: 'DownBlock', shape: 'D × 14 × 14', tone: 'down' },
  down2: { x: 190, y: 206, w: 96, h: 40, label: 'DownBlock', shape: '2D × 7 × 7', tone: 'down' },
  flat: { x: 250, y: 292, w: 96, h: 40, label: 'Flatten', shape: '2D × 1 × 1', tone: 'mid' },
  unflat: { x: 374, y: 292, w: 96, h: 40, label: 'Unflatten', shape: '2D × 7 × 7', tone: 'mid' },
  up1: { x: 434, y: 206, w: 96, h: 40, label: 'UpBlock', shape: 'D × 14 × 14', tone: 'up' },
  up2: { x: 474, y: 120, w: 96, h: 40, label: 'UpBlock', shape: 'D × 28 × 28', tone: 'up' },
  convOut: { x: 514, y: 34, w: 96, h: 40, label: 'ConvBlock', shape: 'D × 28 × 28' },
  out: { x: 636, y: 34, w: 80, h: 40, label: 'Conv 3×3', shape: '1 × 28 × 28', tone: 'io' },
}

function Box({ b }: { b: Block }) {
  return (
    <g className={`unet__block unet__block--${b.tone ?? 'plain'}`}>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" />
      <text x={b.x + b.w / 2} y={b.y + 17} className="unet__label">
        {b.label}
      </text>
      <text x={b.x + b.w / 2} y={b.y + 31} className="unet__shape">
        {b.shape}
      </text>
    </g>
  )
}

const r = (b: Block) => [b.x + b.w, b.y + b.h / 2] as const
const l = (b: Block) => [b.x, b.y + b.h / 2] as const
const bottom = (b: Block) => [b.x + b.w / 2, b.y + b.h] as const
const top = (b: Block) => [b.x + b.w / 2, b.y] as const

export function UNetDiagram() {
  const flows: Array<[readonly [number, number], readonly [number, number]]> = [
    [r(B.input), l(B.convIn)],
    [bottom(B.convIn), top(B.down1)],
    [bottom(B.down1), top(B.down2)],
    [bottom(B.down2), top(B.flat)],
    [r(B.flat), l(B.unflat)],
    [top(B.unflat), bottom(B.up1)],
    [top(B.up1), bottom(B.up2)],
    [top(B.up2), bottom(B.convOut)],
    [r(B.convOut), l(B.out)],
  ]
  const skips: Array<[Block, Block, string]> = [
    [B.convIn, B.convOut, 'concat → 2D'],
    [B.down1, B.up2, 'concat → 2D'],
    [B.down2, B.up1, 'concat → 4D'],
  ]
  return (
    <svg className="unet" viewBox="0 0 726 360" role="img" aria-labelledby="unet-title unet-desc">
      <title id="unet-title">UNet used in Part B</title>
      <desc id="unet-desc">
        Encoder: ConvBlock at 28 by 28, two DownBlocks to 14 by 14 and 7 by 7, average-pool Flatten to 1 by 1.
        Decoder: Unflatten back to 7 by 7, two UpBlocks to 14 and 28, a ConvBlock and a final 3 by 3 convolution.
        Skip connections concatenate encoder features into the decoder at 7, 14 and 28 pixels.
      </desc>
      <defs>
        <marker id="unet-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L8 4L0 8z" className="unet__arrowhead" />
        </marker>
      </defs>
      {skips.map(([a, b, label]) => {
        const [x1, y1] = r(a)
        const [x2, y2] = l(b)
        return (
          <g key={label + a.y}>
            <path className="unet__skip" d={`M${x1} ${y1 - 8} H${x2}`} markerEnd="url(#unet-arrow)" />
            <text className="unet__skiplabel" x={(x1 + x2) / 2} y={y2 - 13}>
              {label}
            </text>
          </g>
        )
      })}
      {flows.map(([[x1, y1], [x2, y2]], i) => (
        <path key={i} className="unet__flow" d={`M${x1} ${y1} L${x2} ${y2}`} markerEnd="url(#unet-arrow)" />
      ))}
      {Object.values(B).map((b) => (
        <Box key={b.label + b.x} b={b} />
      ))}
      <text className="unet__legend" x="10" y="350">
        D = 128 for the denoiser (7,891,073 parameters) · D = 64 for flow matching
      </text>
    </svg>
  )
}
