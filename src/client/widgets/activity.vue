<template>
<MkContainer :show-header="props.showHeader" :naked="props.transparent">
	<template #header><i class="fas fa-chart-bar"></i>{{ $ts._widgets.activity }}</template>
	<template #func><button @click="toggleView()" class="_button"><i class="fas fa-sort"></i></button></template>

	<div>
		<MkLoading v-if="fetching"/>
		<template v-else>
			<XCalendar v-show="props.view === 0" :data="[].concat(activity)"/>
			<XChart v-show="props.view === 1" :data="[].concat(activity)"/>
		</template>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@client/components/ui/container.vue';
import define from './define';
import XCalendar from './activity.calendar.vue';
import XChart from './activity.chart.vue';
import * as os from '@client/os';

const widget = define({
	name: 'activity',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		transparent: {
			type: 'boolean',
			default: false,
		},
		view: {
			type: 'number',
			default: 0,
			hidden: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer,
		XCalendar,
		XChart,
	},
	data() {
		return {
			fetching: true,
			activity: null,
		};
	},
	mounted() {
		os.api('charts/user/notes', {
			userId: this.$i.id,
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
		toggleView() {
			if (this.props.view === 1) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
			this.save();
		}
	}
});
</script>
