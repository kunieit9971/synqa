type Props = {
  onClick: () => void
  className?: string
}

export function HelpLinkButton({ onClick, className = '' }: Props) {
  return (
    <button
      type="button"
      className={`help-link-btn ${className}`.trim()}
      onClick={onClick}
    >
      ご利用方法はこちら
    </button>
  )
}
