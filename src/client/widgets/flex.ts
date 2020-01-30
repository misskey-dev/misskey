const basisSteps = [25, 50, 75, 100]
const previewHeights = [200, 300, 400, 500]

export const heightStyle = (step: number) => `flex-basis: calc(${basisSteps[step] || basisSteps[0]}% - var(--margin)); height: ${previewHeights[step] || previewHeights[0]}px;`
