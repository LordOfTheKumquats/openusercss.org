import {bulmaComponentGenerator as bulma} from 'vue-bulma-components'
import themeCard from '../../elements/theme-card/theme-card.vue'
import formWrapper from '../../elements/form-wrapper/form-wrapper.vue'
import flushImg from '../../elements/flush-img/flush-img.vue'
import icon from '../../elements/icon/icon.vue'
import notification from '../../elements/notification/notification.vue'
import button from '../../elements/button/button.vue'

export default {
  'components': {
    'b-columns':   bulma('columns', 'div'),
    'b-column':    bulma('column', 'div'),
    'b-box':       bulma('box', 'div'),
    'b-section':   bulma('section', 'div'),
    'b-container': bulma('container', 'div'),
    'b-field':     bulma('field', 'div'),
    'b-label':     bulma('label', 'label'),
    'b-input':     bulma('input', 'input'),
    'b-textarea':  bulma('textarea', 'textarea'),
    'b-select':    bulma('select', 'select'),
    'b-control':   bulma('control', 'div'),
    'b-checkbox':  bulma('checkbox', 'checkbox'),
    'b-radio':     bulma('radio', 'radio'),
    'b-button':    bulma('button', 'button'),
    'b-help':      bulma('help', 'p'),
    'big-button':  button,
    themeCard,
    flushImg,
    formWrapper,
    icon,
    notification
  },
  'methods': {
    'send': (event) => {
      event.preventDefault()
      console.log(event)
    }
  }
}