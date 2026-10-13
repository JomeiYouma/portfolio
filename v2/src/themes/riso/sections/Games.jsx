import SectionHead from '../components/SectionHead'
import games from '../../../data/games.json'
import { useI18n } from '../../../hooks/useI18n'
import { asset } from '../../../utils/asset'

const Games = ({ number, lang }) => {
  const { t } = useI18n()

  return (
    <section id="games" className="rz-section" aria-labelledby="rz-games-title">
      <SectionHead number={number} eyebrow={t('games.eyebrow')} title={t('games.title')} titleId="rz-games-title" />

      <ul className="rz-games rz-wrap">
        {games.map((game) => {
          const title = game.title[lang] || game.title.en
          return (
            <li key={game.id} data-rz-reveal>
              <a
                className="rz-game rz-card"
                href={game.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('games.play')} : ${title} (${t('accessibility.opensNewTab')})`}
              >
                <span className="rz-shot">
                  <img src={asset(`assets/images/${game.image}`)} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="rz-game-body">
                  <span className="rz-game-title">{title}</span>
                  <span className="rz-game-desc">{game.description[lang] || game.description.en}</span>
                  <span className="rz-game-foot">
                    <span className="rz-eyebrow">{game.tech}</span>
                    <span className="rz-game-play">{t('games.play')} <span aria-hidden="true">→</span></span>
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default Games
