<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
    <!-- このコンポーネントの要素のclassは親から利用されるのでむやみに弄らないこと -->
    <section>


        <header v-if="!category" class="_acrylic" @click="shown = !shown">
            <i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i>
            <slot></slot>
            ({{ emojis.length }})
        </header>
        <header v-else-if="category.length === 1" class="_acrylic" @click="shown = !shown">
            <i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i>
            {{ category[0] }}
            ({{
                emojis.filter(e => category === null ? (e.category === 'null' || !e.category) : e.category === category[0]).length
            }})
        </header>
        <header v-else class="_acrylic" style="top:unset;" @click="toggleShown_fol">
            <i class="toggle ti-fw" :class="shown_fol? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i>
            {{ category[0] || i18n.ts.other }}
            <template v-if="category.length !== 1">
                ({{ i18n.ts.Folder }})
            </template>
            <template v-else>
                ({{
                    emojis.filter(e => category === null ? (e.category === 'null' || !e.category) : e.category === category[0]).length
                }}) 2
            </template>
        </header>
        <template v-for="(n, index) in category" v-if="shown_fol">
            <header
                    v-if="emojis.filter(e => category === null ? (e.category === 'null' || !e.category) : e.category === category[0]).length !== 0 || index!==0"
                    style="top:unset;padding-left: 18px;"
                    class="_acrylic"
                    @click="toggleShown(index)"
            >
                <i class="toggle ti-fw" :class="shown_fold[index] ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i>
                {{ n || i18n.ts.other }}
                ({{
                    emojis.filter(e => category === null ? (e.category === 'null' || !e.category) : e.category === (index === 0 && category !== undefined ? category[0] : `${category[0]}/${n}`)).length
                }})
            </header>
            <div v-if="shown_fold[index]" class="body">
                <button
                        v-for="emoji in emojis.filter(e => category === null ? (e.category === 'null' || !e.category) : e.category ===( index === 0 && category !== undefined ? category[0] : `${category[0]}/${n}`)).map(e => `:${e.name}:`)"
                        :key="emoji"
                        :data-emoji="emoji"
                        class="_button item"
                        @pointerenter="computeButtonTitle"
                        @click="emit('chosen', emoji, $event)"
                >
                    <MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
                    <MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
                </button>
            </div>
        </template>

        <div v-if="shown && category" class="body">
            <button
                    v-for="emoji in emojis.filter(e => e.category === category[0]).map(e => `:${e.name}:`)"
                    :key="emoji"
                    :data-emoji="emoji"
                    class="_button item"
                    @pointerenter="computeButtonTitle"
                    @click="emit('chosen', emoji, $event)"
            >
                <MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
                <MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
            </button>
        </div>
        <div v-else-if="shown && !category" class="body">
            <button
                    v-for="emoji in emojis"
                    :key="emoji"
                    :data-emoji="emoji"
                    class="_button item"
                    @pointerenter="computeButtonTitle"
                    @click="emit('chosen', emoji, $event)"
            >
                <MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
                <MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
            </button>
        </div>

    </section>
</template>

<script lang="ts" setup>
import {ref, computed, Ref} from 'vue';
import {getEmojiName} from '@/scripts/emojilist.js';
import {i18n} from "../i18n.js";

const props = defineProps<{
    emojis: string[] | Ref<string[]>;
    initialShown?: boolean;
    category?: string[];
}>();

const emit = defineEmits<{
    (ev: 'chosen', v: string, event: MouseEvent): void;
}>();

const toggleShown = (index) => {
    shown_fold.value[index] = !shown_fold.value[index];

};

const toggleShown_fol = () => {
    for (let i = 0; i < shown_fold.value.length; i++) {
        shown_fold.value[i] = false;
    }
    shown_fol.value = !shown_fol.value;
};

const emojis = computed(() => Array.isArray(props.emojis) ? props.emojis : props.emojis.value);
const shown_fold = ref(Array(props.category === undefined ? 0 : props.category.length).fill(false));
const shown = ref(!!props.initialShown);
const shown_fol = ref(!!props.initialShown);

/** @see MkEmojiPicker.vue */
function computeButtonTitle(ev: MouseEvent): void {
    const elm = ev.target as HTMLElement;
    const emoji = elm.dataset.emoji as string;
    elm.title = getEmojiName(emoji) ?? emoji;
}

</script>
