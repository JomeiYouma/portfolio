import all from './projects.json'

// Browser games are shown in their own section (games.json). A project that
// names its game stays in the data, out of every project list.
export const projects = all.filter((project) => !project.game)
