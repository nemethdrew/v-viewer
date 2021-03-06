import Viewer from 'viewerjs'
import { debounce } from 'throttle-debounce'

const install = (Vue, {name = 'viewer', debug = false}) => {
  // 使用去抖避免不必要的大量突发重建
  const createViewer = debounce(50, (el, binding) => {
    // nextTick执行，否则可能漏掉未渲染完的子元素
    Vue.nextTick(() => {
      destroyViewer(el)
      const options = binding.value
      el[`$${name}`] = new Viewer(el, options)
      log('viewer created')
    })
  })

  function createObserver (el, binding) {
    destroyObserver(el)
    const MutationObserver = global.MutationObserver || global.WebKitMutationObserver || global.MozMutationObserver
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        log('viewer mutation:' + mutation.type)
        createViewer(el, binding)
      })
    })
    const config = { attributes: true, childList: true, characterData: true, subtree: true }
    observer.observe(el, config)
    el['$viewerMutationObserver'] = observer
    log('observer created')
  }

  function destroyViewer (el) {
    if (!el[`$${name}`]) {
      return
    }
    el[`$${name}`].destroy()
    delete el[`$${name}`]
    log('viewer destroyed')
  }

  function destroyObserver (el) {
    if (!el['$viewerMutationObserver']) {
      return
    }
    el['$viewerMutationObserver'].disconnect()
    delete el['$viewerMutationObserver']
    log('observer destroyed')
  }

  function log (content) {
    debug && console.log(content)
  }

  Vue.directive('viewer', {
    bind (el, binding) {
      log('viewer bind')
      createViewer(el, binding)

      // 是否监听变化
      if (!binding.modifiers.static) {
        // 增加dom变化监听
        createObserver(el, binding)
      }
    },
    unbind (el, binding) {
      log('viewer unbind')
      // 销毁dom变化监听
      destroyObserver(el)
      // 销毁viewer
      destroyViewer(el)
    }
  })
}

export default {
  install
}
