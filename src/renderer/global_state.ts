import { reactive } from "vue";


export const route_data = reactive({
    active_modal: "",
    load_modal_data: [] as string[],
    mon_name: "",

    request_load_modal(data:string[]) {
        if (this.active_modal.length > 0) return;
        this.active_modal = "load_route";
        this.load_modal_data = data;
        console.log("load modal requested");
    },
    is_load_modal_active() {
        return this.active_modal === "load_route";
    },
    close_modal() {
        this.active_modal = "";
    }
});
