<template>
<!-- TODO: リファクタの余地がありそう -->
<XMainColumn v-if="column.type === 'main'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XWidgetsColumn v-else-if="column.type === 'widgets'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XNotificationsColumn v-else-if="column.type === 'notifications'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XTlColumn v-else-if="column.type === 'tl'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XListColumn v-else-if="column.type === 'list'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XAntennaColumn v-else-if="column.type === 'antenna'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XMentionsColumn v-else-if="column.type === 'mentions'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
<XDirectColumn v-else-if="column.type === 'direct'" :column="column" :is-stacked="isStacked" @parent-focus="$emit('parent-focus', $event)"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XMainColumn from './main-column.vue';
import XTlColumn from './tl-column.vue';
import XAntennaColumn from './antenna-column.vue';
import XListColumn from './list-column.vue';
import XNotificationsColumn from './notifications-column.vue';
import XWidgetsColumn from './widgets-column.vue';
import XMentionsColumn from './mentions-column.vue';
import XDirectColumn from './direct-column.vue';

export default defineComponent({
	components: {
		XMainColumn,
		XTlColumn,
		XAntennaColumn,
		XListColumn,
		XNotificationsColumn,
		XWidgetsColumn,
		XMentionsColumn,
		XDirectColumn
	},
	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	methods: {
		focus() {
			this.$children[0].focus();
		}
	}
});
</script>
