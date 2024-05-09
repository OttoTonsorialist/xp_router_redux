<template>
    <Teleport to="body">
        <div
            v-if="is_active"
            class="w-full h-full absolute top-0 bg-black bg-opacity-30"
        >
            <div class="bg-black shadow-lg shadow-slate-900 fixed top-1/2 left-1/2 w-3/4 md:w-1/4 -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl">
                <div class="flex justify-between">
                    <span class="font-bold text-3xl">
                        {{ heading }}
                    </span>
                    <button @click="$emit('close_modal')">
                        &#10006;
                    </button>
                </div>
                <div v-if="is_active" class="p-1">
                    <slot />
                </div>
            </div>
        </div>
    </Teleport>
</template>


<script lang="ts">
export default {
    props: {
        is_active: {
            type: Boolean,
            default: false,
        },
        heading: {
            type: String,
            default: "",
        }
    },
    emits: {
        close_modal: null,
    },
    watch: {
        is_active() {
            if (this.is_active) {
                window.addEventListener("keydown", this.escape_listener);
            } else {
                window.removeEventListener("keydown", this.escape_listener);
            }
        }
    },
    methods: {
        escape_listener(event:KeyboardEvent) {
            if (event.code === 'Escape') {
                this.$emit('close_modal');
            }
        }
    }
}

</script>