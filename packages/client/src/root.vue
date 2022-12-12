<template>
<ZenUi v-if="searchString === '?zen'" />
<VisitorUi v-else-if="!$i" />
<DeckUi v-else-if="ui === 'deck'" />
<ClassicUi v-else-if="ui === 'classic'" />
<UniversalUi v-else />
</template>

<script lang="ts" setup>
import ZenUi from '@/ui/zen.vue';
import VisitorUi from '@/ui/visitor.vue';
import DeckUi from '@/ui/deck.vue';
import ClassicUi from '@/ui/classic.vue';
import UniversalUi from '@/ui/universal.vue';
import { $i } from '@/account';
import { ui } from '@/config';

const searchString = window.location.search;
</script>
