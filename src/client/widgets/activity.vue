<template>
<div>
	<mk-container :show-header="props.design === 0" :naked="props.design === 2">
		<template #header><fa :icon="faChartBar"/>{{ $t('_widgets.activity') }}</template>
		<template #func><button @click="toggleView()" class="_button"><fa :icon="faSort"/></button></template>

		<div>
			<mk-loading v-if="fetching"/>
			<template v-else>
				<x-calendar v-show="props.view === 0" :data="[].concat(activity)"/>
				<x-chart v-show="props.view === 1" :data="[].concat(activity)"/>
			</template>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import { faChartBar, faSort } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import define from './define';
import i18n from '../i18n';
import XCalendar from './activity.calendar.vue';
import XChart from './activity.chart.vue';

export default define({
	name: 'activity',
	props: () => ({
		design: 0,
		view: 0
	})
}).extend({
	i18n,
	components: {
		MkContainer,
		XCalendar,
		XChart,
	},
	data() {
		return {
			fetching: true,
			activity: null,
			faChartBar, faSort
		};
	},
	mounted() {
		this.$root.api('charts/user/notes', {
			userId: this.$store.state.i.id,
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
		func() {
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		},
		toggleView() {
			if (this.props.view == 1) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
			this.save();
		}
	}
});
</script>
