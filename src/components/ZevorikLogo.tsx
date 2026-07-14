'use client'

export function ZevorikLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/zevorix-logo.png"
        alt="ZEVORIK"
        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
      />
    </div>
  )
}
