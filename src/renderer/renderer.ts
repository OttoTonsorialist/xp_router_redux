import { createApp } from 'vue';
import App from './components/app.vue';
import $bus from './utils/event_bus';
import { IpcEventController } from './controllers/ipc_event_controller';
import { route_data } from './global_state';

import './assets/style.css';

const ipc_event_controller:IpcEventController = new IpcEventController();
const app = createApp(App);

// TODO: do we still want to use this global property? if so, should indclude it in the declaration
app.config.globalProperties.$bus = $bus;

app.config.globalProperties.route_data = route_data;
app.config.globalProperties.ipc_event_controller = ipc_event_controller;
app.config.globalProperties.battle_summary_width = 1400;
app.config.globalProperties.edit_pane_width = 900;

app.mount('#app');

// shim code. Maybe move out to a separate file? unclear...
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    route_data: typeof route_data,
    ipc_event_controller: typeof ipc_event_controller,
    battle_summary_width: number,
    edit_plane_width: number,
  }
}