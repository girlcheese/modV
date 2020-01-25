export default {
  meta: {
    name: 'Media',
    type: '2d'
  },

  props: {
    media: {
      type: 'texture',
      label: 'Media'
    },

    scale: {
      type: 'float',
      default: 1,
      min: 0,
      max: 1
    }
  },

  draw({ canvas, context }) {
    const { width, height } = canvas

    const {
      scale,
      media: { texture }
    } = this

    if (this.media) {
      context.drawImage(
        texture,
        width / 2 - (texture.width * scale) / 2,
        height / 2 - (texture.height * scale) / 2,
        texture.width * scale,
        texture.height * scale
      )
    }
  }
}
