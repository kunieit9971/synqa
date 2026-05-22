type Props = {
  onClick: () => void
}

export function MenuBackButton({ onClick }: Props) {
  return (
    <button
      type="button"
      className="btn-menu-back"
      onClick={onClick}
      aria-label="最初のメニューに戻る"
    >
      <span className="btn-menu-back-icon" aria-hidden>
        ☰
      </span>
      <span className="btn-menu-back-text">
        <span className="btn-menu-back-label">メニュー</span>
        <span className="btn-menu-back-sub">打刻 / 管理者の選択</span>
      </span>
    </button>
  )
}
