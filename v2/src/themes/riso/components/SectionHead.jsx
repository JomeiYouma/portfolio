// French sets a space before ? ! : ; — keep it from stranding the mark at the
// start of a line, and keep hyphenated words in one piece, since these titles
// are set large enough to wrap.
const typeset = (title) =>
  title
    .replace(/ ([?!:;])/g, '\u00a0$1')
    .split(' ')
    .map((word, i) => (
      <span key={i} className={word.includes('-') ? 'rz-nowrap' : undefined}>
        {i > 0 ? ' ' : ''}{word}
      </span>
    ))

/**
 * Section opener: a dithered ink band that dissolves into the paper, then the
 * section number, its label and its poster title.
 */
const SectionHead = ({ number, eyebrow, title, titleId }) => (
  <>
    <div className="rz-band" aria-hidden="true" />
    <header className="rz-head rz-wrap" data-rz-reveal>
      <span className="rz-head-num" aria-hidden="true">{number}</span>
      <p className="rz-eyebrow">{eyebrow}</p>
      <h2 id={titleId} className="rz-title">{typeset(title)}</h2>
    </header>
  </>
)

export default SectionHead
