import { useI18n } from '../hooks/useI18n'

// Drawn once per page load: every theme and both languages show the same line
const draw = Math.random()

/**
 * Footer sentence, "made with <struck claim> <what it really took> // year".
 * One of the lines of contact.footerLines, picked at random on each load.
 */
const FooterLine = () => {
  const { t } = useI18n()
  const lines = t('contact.footerLines')
  const line = lines[Math.floor(draw * lines.length)]

  return (
    <>
      {t('contact.footerLead')} <s>{line.struck}</s> {line.instead} {t('contact.footerYear')}
    </>
  )
}

export default FooterLine
