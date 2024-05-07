import { createApp } from 'vue';
import App from './App.vue';
import $bus from './utils/events';

import './assets/style.css';
import './demos/ipc';
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App);

app.config.globalProperties.$bus = $bus;
app.config.globalProperties.battle_summary_width = 1400;
app.config.globalProperties.edit_pane_width = 900;

app.mount('#app').$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*');
});
