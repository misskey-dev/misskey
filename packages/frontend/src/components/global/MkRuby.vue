<script setup lang="ts">
import { computed } from 'vue';
import MkEmoji from './MkEmoji.vue';
const props = defineProps<{
    base: string;
    text: string;
    basetype: string;
}>();
</script>

<template>
    <ruby>

        <MkEmoji v-if="basetype === 'unicodeEmoji' " class="emoji" :emoji="base" :normal="true"/>
        <p v-else >{{base}}</p>
        <rt>{{text}}</rt>
    </ruby>
</template>
