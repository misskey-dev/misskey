<template>
<div class="mk-activity">
	<ui-container :show-header="design == 0" :naked="design == 2">
		<template #header><fa icon="chart-bar"/>{{ $t('title') }}</template>
		<template #func><button :title="$t('toggle')" @click="toggle"><fa icon="sort"/></button></template>

		<p :class="$style.fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
		<template v-else>
			<x-calendar v-show="view == 0" :data="[].concat(activity)"/>
			<x-chart v-show="view == 1" :data="[].concat(activity)"/>
		</template>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XCalendar from './activity.calendar.vue';
import XChart from './activity.chart.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/activity.vue'),
	components: {
		XCalendar,
		XChart
	},
	props: {
		design: {
			default: 0
		},
		initView: {
			default: 0
		},
		user: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			fetching: true,
			activity: null,
			view: this.initView
		};
	},
	mounted() {
		this.$root.api('charts/user/notes', {
			userId: this.user.id,
			span: 'day',
			limit: 7 * 21
		}).then(activity => {
			this.activity = activity.diffs.normal.map((_, i) => ({
				total: activity.diffs.normal[i] + activity.diffs.reply[i] + activity.diffs.renote[i],
				notes: activity.diffs.normal[i],
				replies: activity.diffs.reply[i],
				renotes: activity.diffs.renote[i]
			}));
			this.fetching = false;
		});
	},
	methods: {
		toggle() {
			if (this.view == 1) {
				this.view = 0;
				this.$emit('viewChanged', this.view);
			} else {
				this.view++;
				this.$emit('viewChanged', this.view);
			}
		}
	}
});
</script>

<style lang="stylus" module>
.fetching
	margin 0
	padding 16px
	text-align center
	color var(--text)

	> [data-icon]
		margin-right 4px

</style>
