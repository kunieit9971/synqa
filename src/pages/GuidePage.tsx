import { GUIDE_SECTIONS } from '../content/guide'

type Props = {
  onBack: () => void
}

export function GuidePage({ onBack }: Props) {
  return (
    <div className="guide-page">
      <header className="guide-header">
        <button type="button" className="btn ghost small guide-back" onClick={onBack}>
          ← 戻る
        </button>
        <div>
          <p className="guide-brand">Synqa</p>
          <h1 className="guide-title">ご利用ガイド</h1>
        </div>
      </header>

      <nav className="guide-toc" aria-label="目次">
        <p className="guide-toc-label">目次</p>
        <ul>
          {GUIDE_SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#guide-${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="guide-sections">
        {GUIDE_SECTIONS.map((section) => (
          <article key={section.id} id={`guide-${section.id}`} className="guide-section panel">
            <h2 className="guide-section-title">{section.title}</h2>
            {section.image ? (
              <figure className="guide-figure">
                <img src={section.image.src} alt={section.image.alt} loading="lazy" />
                {section.image.caption ? (
                  <figcaption>{section.image.caption}</figcaption>
                ) : null}
              </figure>
            ) : null}
            {section.blocks.map((block, i) =>
              block.type === 'text' ? (
                <div key={i} className="guide-text">
                  {block.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              ) : null,
            )}
            {section.tips?.length ? (
              <ul className="guide-tips">
                {section.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      <footer className="guide-footer">
        <button type="button" className="btn primary block" onClick={onBack}>
          閉じる
        </button>
      </footer>
    </div>
  )
}
