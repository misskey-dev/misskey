<template>
<div class="zbcjwnqg">
	<div class="selects" style="display: flex;">
		<MkSelect v-model="chartSrc" style="margin: 0; flex: 1;">
			<optgroup :label="$ts.federation">
				<option value="federation">{{ $ts._charts.federation }}</option>
				<option value="ap-request">{{ $ts._charts.apRequest }}</option>
			</optgroup>
			<optgroup :label="$ts.users">
				<option value="users">{{ $ts._charts.usersIncDec }}</option>
				<option value="users-total">{{ $ts._charts.usersTotal }}</option>
				<option value="active-users">{{ $ts._charts.activeUsers }}</option>
			</optgroup>
			<optgroup :label="$ts.notes">
				<option value="notes">{{ $ts._charts.notesIncDec }}</option>
				<option value="local-notes">{{ $ts._charts.localNotesIncDec }}</option>
				<option value="remote-notes">{{ $ts._charts.remoteNotesIncDec }}</option>
				<option value="notes-total">{{ $ts._charts.notesTotal }}</option>
			</optgroup>
			<optgroup :label="$ts.drive">
				<option value="drive-files">{{ $ts._charts.filesIncDec }}</option>
				<option value="drive">{{ $ts._charts.storageUsageIncDec }}</option>
			</optgroup>
		</MkSelect>
		<MkSelect v-model="chartSpan" style="margin: 0 0 0 10px;">
			<option value="hour">{{ $ts.perHour }}</option>
			<option value="day">{{ $ts.perDay }}</option>
		</MkSelect>
	</div>
	<div class="chart">
		<MkChart :src="chartSrc" :span="chartSpan" :limit="chartLimit" :detailed="detailed"></MkChart>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import MkSelect from '@/components/form/select.vue';
import MkChart from '@/components/chart.vue';

export default defineComponent({
	components: {
		MkSelect,
		MkChart,
	},

	props: {
		chartLimit: {
			type: Number,
			required: false,
			default: 90
		},
		detailed: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	setup() {
		const chartSpan = ref<'hour' | 'day'>('hour');
		const chartSrc = ref('active-users');

		return {
			chartSrc,
			chartSpan,
		};
	},
});
</script>

<style lang="scss" scoped>
.zbcjwnqg {
	> .selects {
	}

	> .chart {
		padding: 8px 0 0 0;
	}
}
</style>
