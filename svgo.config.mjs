export default {
  multipass: true,
  floatPrecision: 2,
  // removeViewBox is not part of preset-default in this SVGO version, so the viewBox stays.
  plugins: ['preset-default', 'removeDimensions'],
}
