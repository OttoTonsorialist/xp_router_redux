<template>
    <ComboBox
        ref="input"
        :cb_options="route_data.load_modal_data"
        :take_focus="true"
        @valid_selection="valid_selection_handler"
        @invalid_selection="invalid_selection_handler"
    />
    <div class="w-full flex justify-between pt-5">
        <button
            @click="cancel"
            class="styled left-0 inline-block"
        >
            Cancel
        </button>
        <button
            ref="submit"
            @click="try_submit_data"
            class="styled right-0 inline-block"
        >Load</button>
    </div>
</template>

<script lang="ts">
    import ComboBox from '@renderer/components/basic_components/combobox.vue'

    export default {
        components: { ComboBox },
        methods: {
            enter_listener(event:KeyboardEvent) {
                if (event.key === 'Enter') {
                    this.try_submit_data();
                }
            },
            try_submit_data(){
                let cur_selection = this._refs().input.selection;
                if (cur_selection !== null) {
                    this.ipc_event_controller.load_route(cur_selection);
                }
            },
            valid_selection_handler() {
                console.log('valid selection handled...');
                this._refs().submit.disabled = false;
            },
            invalid_selection_handler() {
                console.log('invalid selection handled...');
                this._refs().submit.disabled = true;
            },
            cancel() {
                this.route_data.close_modal();
            },
            _refs(){
                return this.$refs as {
                    submit: HTMLButtonElement;
                    input: typeof ComboBox;
                };
            },
        },
        mounted() {
            window.addEventListener("keydown", this.enter_listener);
        },
        emits: {
            close_modal: null,
        },
        unmounted() {
            window.removeEventListener("keydown", this.enter_listener);
        },
    }
</script>