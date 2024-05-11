<template>
        <Combobox v-model="raw_selection">
            <div class="relative mt-1">
                <div
                class="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md sm:text-sm"
                >
                    <ComboboxInput
                        ref="input"
                        @change="query = $event.target.value"
                        class="p-1 w-full focus:outline-none"
                    />
                    <ComboboxButton
                        class="absolute inset-y-0 right-0 flex items-center pr-2 pl-2"
                    >
                        <ChevronUpDownIcon
                            class="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </ComboboxButton>
                </div>
                <TransitionRoot
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    @after-leave="query = ''"
                >
                    <ComboboxOptions
                        class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                    >
                        <div
                            v-if="cb_options.length === 0 && query !== ''"
                            class="relative cursor-default select-none px-4 py-2 text-gray-700"
                        >
                            No result
                        </div>

                        <ComboboxOption
                            v-for="cur_item in filtered_options"
                            as="template"
                            :key="cur_item"
                            :value="cur_item"
                            v-slot="{ selected, active }"
                        >
                            <li
                                class="relative cursor-default select-none py-2 pl-10 pr-4"
                                :class="{
                                'bg-teal-600 text-white': active,
                                'text-gray-900': !active,
                                }"
                            >
                                <span
                                    class="block truncate"
                                    :class="{ 'font-medium': selected, 'font-normal': !selected }"
                                >
                                    {{ cur_item }}
                                </span>
                                <span
                                    v-if="selected"
                                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                                    :class="{ 'text-white': active, 'text-teal-600': !active }"
                                >
                                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                </span>
                            </li>
                        </ComboboxOption>
                    </ComboboxOptions>
                </TransitionRoot>
            </div>
        </Combobox>
</template>

<script lang="ts">
    import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, ComboboxButton, TransitionRoot } from '@headlessui/vue'
    import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'

    import { ref, defineComponent } from 'vue';

    export default defineComponent({
        components: { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, ComboboxButton, TransitionRoot, CheckIcon, ChevronUpDownIcon },
        computed: {
            filtered_options() {
                if (this.query === "") {
                    return this.cb_options;
                } else {
                    let q_lower = this.query.toLowerCase();
                    return this.cb_options.filter((x) => {
                        return x.toLowerCase().includes(q_lower);
                    });
                }
            },
            selection(): null | string {
                if (!this.is_valid) return null;
                return this.raw_selection;
            },
        },
        data() {
            return {
                raw_selection: "",
                query: this.initial_query,
                is_valid: false,
            }
        },
        emits: {
            valid_selection: null,
            invalid_selection: null,
        },
        methods: {
            _refs() {
                return this.$refs as {
                    input: typeof ComboboxInput;
                };
            }
        },
        mounted() {
            if (this.take_focus) {
                this.$nextTick(() => {
                    this._refs().input.el.focus();
                    this.$emit('invalid_selection');
                });
            }
        },
        props: {
            initial_query: {
                type: String,
                default: "",
            },
            cb_options: {
                type: Array<string>,
                default: [],
            },
            take_focus: {
                type: Boolean,
                default: false,
            }
        },
        /*
        setup() {
            const input = ref<HTMLInputElement | null>(null);

            return {
                input
            };
        },
        */
        watch: {
            raw_selection() {
                console.log("raw selection is now: " + this.raw_selection);
                this.is_valid = this.cb_options.includes(this.raw_selection);
                if (this.is_valid) {
                    console.log("emitting valid selection!");
                    this.$emit('valid_selection');
                } else {
                    console.log("emitting invalid selection!");
                    this.$emit('invalid_selection');
                }
            }
        },
    });
</script>