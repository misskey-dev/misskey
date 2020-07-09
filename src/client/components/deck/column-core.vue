<template>
<!-- TODO: リファクタの余地がありそう -->
<x-widgets-column v-if="column.type === 'widgets'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-notifications-column v-else-if="column.type === 'notifications'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-tl-column v-else-if="column.type === 'home'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-tl-column v-else-if="column.type === 'local'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-tl-column v-else-if="column.type === 'social'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-tl-column v-else-if="column.type === 'global'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-list-column v-else-if="column.type === 'list'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-antenna-column v-else-if="column.type === 'antenna'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-tl-column v-else-if="column.type === 'hashtag'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-mentions-column v-else-if="column.type === 'mentions'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
<x-direct-column v-else-if="column.type === 'direct'" :column="column" :is-stacked="isStacked" v-on="$listeners"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XTlColumn from './tl-column.vue';
import XAntennaColumn from './antenna-column.vue';
import XNotificationsColumn from './notifications-column.vue';
import XWidgetsColumn from './widgets-column.vue';
import XMentionsColumn from './mentions-column.vue';
import XDirectColumn from './direct-column.vue';

export default Vue.extend({
	components: {
		XTlColumn,
		XAntennaColumn,
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
