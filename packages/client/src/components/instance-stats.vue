<template>
<div class="zbcjwnqg" style="margin-top: -8px;">
	<div class="selects" style="display: flex;">
		<MkSelect v-model="chartSrc" style="margin: 0; flex: 1;">
			<optgroup :label="$ts.federation">
				<option value="federation-instances">{{ $ts._charts.federationInstancesIncDec }}</option>
				<option value="federation-instances-total">{{ $ts._charts.federationInstancesTotal }}</option>
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
				<option value="drive-files-total">{{ $ts._charts.filesTotal }}</option>
				<option value="drive">{{ $ts._charts.storageUsageIncDec }}</option>
				<option value="drive-total">{{ $ts._charts.storageUsageTotal }}</option>
			</optgroup>
		</MkSelect>
		<MkSelect v-model="chartSpan" style="margin: 0 0 0 10px;">
			<option value="hour">{{ $ts.perHour }}</option>
			<option value="day">{{ $ts.perDay }}</option>
		</MkSelect>
	</div>
	<MkChart :src="chartSrc" :span="chartSpan" :limit="chartLimit" :detailed="detailed"></MkChart>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import MkSelect from '@/components/form/select.vue';
import MkChart from '@/components/chart.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';

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
		const chartSrc = ref('notes');

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
		padding: 8px 16px 0 16px;
	}
}
</style>
