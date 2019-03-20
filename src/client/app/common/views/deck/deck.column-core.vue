<template>
<x-widgets-column v-if="column.type == 'widgets'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-notifications-column v-else-if="column.type == 'notifications'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-tl-column v-else-if="column.type == 'home'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-tl-column v-else-if="column.type == 'local'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-tl-column v-else-if="column.type == 'hybrid'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-tl-column v-else-if="column.type == 'global'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-tl-column v-else-if="column.type == 'list'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-tl-column v-else-if="column.type == 'hashtag'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-mentions-column v-else-if="column.type == 'mentions'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
<x-direct-column v-else-if="column.type == 'direct'" :column="column" :is-stacked="isStacked" :columnNumber="columnNumber" v-on="$listeners"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XTlColumn from './deck.tl-column.vue';
import XNotificationsColumn from './deck.notifications-column.vue';
import XWidgetsColumn from './deck.widgets-column.vue';
import XMentionsColumn from './deck.mentions-column.vue';
import XDirectColumn from './deck.direct-column.vue';

export default Vue.extend({
	components: {
		XTlColumn,
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
		},
		columnNumber: {
			type: Number,
			required: true
		}
	},

	methods: {
		focus() {
			this.$children[0].focus();
		}
	}
});
</script>
