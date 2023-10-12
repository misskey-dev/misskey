<script setup lang="ts">
import { computed } from 'vue';
import MkEmoji from './MkEmoji.vue';
import MkCustomEmoji from './MkCustomEmoji.vue';
const props = defineProps<{
    base: string;
    text: string;
    basetype: string;
}>();
</script>

<template>
    <ruby>
        <MkEmoji v-if="basetype === 'unicodeEmoji' " class="emoji" :emoji="base" :normal="true" />
        <MkCustomEmoji v-else-if="basetype === 'emojiCode' " :name="base"/>
        <span style="white-space: pre-wrap;" v-else >{{base}}</span>
        <rt>{{text}}</rt>
    </ruby>
</template>
<style>
</style>
