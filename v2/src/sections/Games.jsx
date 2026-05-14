import { useI18n } from '../hooks/useI18n'
import Waves from '../components/Waves'
import Reveal from '../components/Reveal'
import games from '../data/games.json'

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
  </svg>
)

const Games = () => {
  const { lang, t } = useI18n()

  return (
    <section
      id="games"
      data-section
      className="section games-section"
      aria-labelledby="games-heading"
    >
      <div className="section-inner games-inner">
        <Reveal as="div" className="games-screen">
          <Waves
            lineColor="#00ffb3"
            backgroundColor="transparent"
            waveSpeedX={0.02}
            waveSpeedY={0.01}
            waveAmpX={40}
            waveAmpY={20}
            friction={0.9}
            tension={0.01}
            maxCursorMove={120}
            xGap={12}
            yGap={36}
            opacity={0.45}
          />

          <span className="games-screen-corner games-screen-corner--tl" aria-hidden="true" />
          <span className="games-screen-corner games-screen-corner--tr" aria-hidden="true" />
          <span className="games-screen-corner games-screen-corner--bl" aria-hidden="true" />
          <span className="games-screen-corner games-screen-corner--br" aria-hidden="true" />

          <div className="games-screen-content">
            <header className="games-screen-header">
              <p className="eyebrow games-eyebrow">{t('games.eyebrow')}</p>
              <h2 id="games-heading" className="games-screen-title">
                {t('games.title')}
              </h2>
              <span className="games-screen-divider" aria-hidden="true" />
            </header>

            <ul className="games-grid">
              {games.map((game) => {
                const title = game.title[lang] || game.title.en
                const description = game.description[lang] || game.description.en
                return (
                  <li key={game.id} className="game-card-wrap">
                    <a
                      href={game.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="game-card cursor-target"
                      aria-label={`${t('games.play')} — ${title} (${t('accessibility.opensNewTab')})`}
                    >
                      <div className="game-card-media">
                        <img
                          src={`/assets/images/${game.image}`}
                          alt=""
                          loading="lazy"
                          className="game-card-img"
                        />
                        <span className="game-card-overlay" aria-hidden="true">
                          <span className="game-play-btn">
                            <PlayIcon />
                            <span>{t('games.play')}</span>
                          </span>
                        </span>
                        <span className="game-card-corner game-card-corner--tl" aria-hidden="true" />
                        <span className="game-card-corner game-card-corner--br" aria-hidden="true" />
                      </div>
                      <div className="game-card-foot">
                        <span className="game-card-title">{title}</span>
                        <span className="game-card-tech">{game.tech}</span>
                      </div>
                      <span className="sr-only">{description}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Games
