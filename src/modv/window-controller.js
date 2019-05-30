import store from '@/store'
import uuidv4 from 'uuid/v4'

class WindowController {
  constructor(Vue, number) {
    this.id = uuidv4()

    return new Promise(resolve => {
      if (window.nw) {
        if (window.nw.open) {
          window.nw.Window.open('output.html', newWindow => {
            this.window = newWindow.window
            if (this.window.document.readyState === 'complete') {
              this.configureWindow(resolve)
            } else {
              this.window.onload = () => {
                this.configureWindow(resolve)
              }
            }
          })
        } else {
          this.window = window.open(
            '',
            '_blank',
            'width=250, height=250, location=no, menubar=no, left=0'
          )

          if (this.window === null || typeof this.window === 'undefined') {
            Vue.$dialog.alert({
              title: 'Could not create Output Window',
              message: `modV couldn't open an Output Window.
 Please check you've allowed pop-ups - then reload`,
              type: 'is-danger',
              hasIcon: true,
              icon: 'times-circle',
              iconPack: 'fa'
            })
            return
          }

          if (this.window.document.readyState === 'complete') {
            this.configureWindow(resolve, number)
          } else {
            this.window.onload = () => {
              this.configureWindow(resolve, number)
            }
          }
        }
      }
    })
  }

  configureWindow(callback, number) {
    const windowRef = this.window
    windowRef.document.title = `modV Output (${number})`
    windowRef.document.body.style.margin = '0px'
    windowRef.document.body.style.backgroundColor = 'black'
    // windowRef.document.body.style.position = 'relative'
    windowRef.document.body.style.display = 'flex'
    windowRef.document.body.style.justifyContent = 'center'
    windowRef.document.body.style.alignItems = 'center'

    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')

    this.canvas.style.backgroundColor = 'transparent'
    // this.canvas.style.left = '50%'
    // this.canvas.style.position = 'absolute'
    // this.canvas.style.top = '50%'
    // this.canvas.style.transform = 'translate(-50%, -50%)'
    this.canvas.style.objectFit = 'cover'
    this.canvas.style.width = '100%'

    this.canvas.addEventListener('dblclick', () => {
      if (!this.canvas.ownerDocument.webkitFullscreenElement) {
        this.canvas.webkitRequestFullscreen()
      } else {
        this.canvas.ownerDocument.webkitExitFullscreen()
      }
    })

    let mouseTimer

    function movedMouse() {
      if (mouseTimer) mouseTimer = null
      this.canvas.ownerDocument.body.style.cursor = 'none'
    }

    this.canvas.addEventListener('mousemove', () => {
      if (mouseTimer) clearTimeout(mouseTimer)
      this.canvas.ownerDocument.body.style.cursor = 'default'
      mouseTimer = setTimeout(movedMouse.bind(this), 200)
    })

    this.window.document.body.appendChild(this.canvas)

    let resizeQueue = {}
    let lastArea = 0
    let resizeRaf

    // Roughly attach to the main RAF loop for smoother resizing
    function resize() {
      if (lastArea < 1) {
        cancelAnimationFrame(resizeRaf)
        return
      }
      resizeRaf = requestAnimationFrame(resize.bind(this))

      if (
        resizeQueue.width * resizeQueue.height + resizeQueue.dpr !==
        lastArea
      ) {
        lastArea = resizeQueue.width * resizeQueue.height + resizeQueue.dpr
        return
      }

      const width = resizeQueue.width
      const height = resizeQueue.height
      const dpr = resizeQueue.dpr
      const emit = resizeQueue.emit

      if (emit && store.state.size.reactToWindowResize) {
        store.dispatch('size/setDimensions', { width, height })
      }

      this.canvas.width = store.state.size.width || width * dpr
      this.canvas.height = store.state.size.height || height * dpr
      // this.canvas.style.width = `${store.state.size.width}px`
      // this.canvas.style.height = `${store.state.size.height}px`

      lastArea = 0
    }

    resizeRaf = requestAnimationFrame(resize.bind(this))

    this.resize = (width, height, dpr = 1, emit = true) => {
      resizeQueue = {
        width,
        height,
        dpr,
        emit
      }
      lastArea = 1
      resizeRaf = requestAnimationFrame(resize.bind(this))
    }

    windowRef.addEventListener('resize', () => {
      let dpr = windowRef.devicePixelRatio

      if (!store.getters['user/useRetina']) {
        dpr = 1
      }

      this.resize(windowRef.innerWidth, windowRef.innerHeight, dpr)
    })
    windowRef.addEventListener(
      'beforeunload',
      () => 'You sure about that, you drunken mess?'
    )
    windowRef.addEventListener('unload', () => {
      store.dispatch('windows/destroyWindow', { windowRef: this.window })
    })

    // eslint-disable-next-line
    if (callback) callback(this)
  }
}

export default WindowController
