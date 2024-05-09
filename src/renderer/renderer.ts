import { createApp } from 'vue';
import App from './components/app.vue';
import $bus from './utils/event_bus';
import { IpcEventController } from './controllers/ipc_event_controller';
import { route_data } from './global_state';

import './assets/style.css';

const ipc_event_controller:IpcEventController = new IpcEventController();
const app = createApp(App);

app.config.globalProperties.$bus = $bus;
app.config.globalProperties.battle_summary_width = 1400;
app.config.globalProperties.edit_pane_width = 900;

app.mount('#app');
