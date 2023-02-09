<template>
<!-- TODO: リファクタの余地がありそう -->
<div v-if="!column">たぶん見えちゃいけないやつ</div>
<XMainColumn v-else-if="column.type === 'main'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XWidgetsColumn v-else-if="column.type === 'widgets'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XNotificationsColumn v-else-if="column.type === 'notifications'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XTlColumn v-else-if="column.type === 'tl'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XListColumn v-else-if="column.type === 'list'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XChannelColumn v-else-if="column.type === 'channel'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XAntennaColumn v-else-if="column.type === 'antenna'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XMentionsColumn v-else-if="column.type === 'mentions'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
<XDirectColumn v-else-if="column.type === 'direct'" :column="column" :is-stacked="isStacked" @parent-focus="emit('parent-focus', $event)"/>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XMainColumn from './main-column.vue';
import XTlColumn from './tl-column.vue';
import XAntennaColumn from './antenna-column.vue';
import XListColumn from './list-column.vue';
import XChannelColumn from './channel-column.vue';
import XNotificationsColumn from './notifications-column.vue';
import XWidgetsColumn from './widgets-column.vue';
import XMentionsColumn from './mentions-column.vue';
import XDirectColumn from './direct-column.vue';
import { Column } from './deck-store';

defineProps<{
	column?: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();
</script>
