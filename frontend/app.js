import { h, mount, createStore } from './framework/index.js'

const store = createStore({})

mount(() => h('div', { class: 'card' }, h('h1', {}, 'Bomberman')), document.getElementById('app'), store)
