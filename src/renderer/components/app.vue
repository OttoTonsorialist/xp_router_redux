<template>
    <div>Text! And things!</div>
    <Modal
        :is_active="route_data.is_load_modal_active()"
        :heading="'Load Route'"
        @close_modal="route_data.close_modal()"
    >
        Test 123
    </Modal>
</template>


<script setup lang="ts">
import { route_data } from '@renderer/global_state';
import Modal from '@renderer/components/modal.vue';
</script>