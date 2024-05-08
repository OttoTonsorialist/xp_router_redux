import { createApp } from 'vue';
import App from './App.vue';
import $bus from './utils/events';
import { IpcEventController } from './controllers/ipc_event_controller';

import './assets/style.css';

const ipc_event_controller:IpcEventController = new IpcEventController();
const app = createApp(App);

app.config.globalProperties.$bus = $bus;
app.config.globalProperties.battle_summary_width = 1400;
app.config.globalProperties.edit_pane_width = 900;

app.mount('#app');
