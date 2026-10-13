import { asset } from './asset'

// Every project and game has one landscape capture (`image`). Those shot again
// for the other frames add `imagePortrait` (gallery cards, detail modal) or
// `imageSquare` (game cards); without them the landscape capture is cropped.
export const workImage = (work, format = 'landscape') => {
  const file =
    (format === 'portrait' && work.imagePortrait) ||
    (format === 'square' && work.imageSquare) ||
    work.image
  return asset(`assets/images/${file}`)
}
