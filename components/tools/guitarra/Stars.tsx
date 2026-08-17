interface Props {
  count: number
  max?: number
  size?: number
  className?: string
}

/** Estrellas ganadas en un nivel. Las no conseguidas quedan en gris. */
export default function Stars({ count, max = 3, size = 16, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${count} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={i < count ? 'text-amber-400' : 'text-gray-300'}
        >
          <path
            fill="currentColor"
            d="M10 1.6l2.47 5.28 5.53.72-4.07 3.9 1.04 5.6L10 14.4l-4.97 2.7 1.04-5.6-4.07-3.9 5.53-.72z"
          />
        </svg>
      ))}
    </span>
  )
}
