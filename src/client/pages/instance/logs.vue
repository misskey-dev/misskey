<template>
<div class="_section">
	<div class="_inputs">
		<MkInput v-model:value="logDomain" :debounce="true">
			<span>{{ $t('domain') }}</span>
		</MkInput>
		<MkSelect v-model:value="logLevel">
			<template #label>{{ $t('level') }}</template>
			<option value="all">{{ $t('levels.all') }}</option>
			<option value="info">{{ $t('levels.info') }}</option>
			<option value="success">{{ $t('levels.success') }}</option>
			<option value="warning">{{ $t('levels.warning') }}</option>
			<option value="error">{{ $t('levels.error') }}</option>
			<option value="debug">{{ $t('levels.debug') }}</option>
		</MkSelect>
	</div>

	<div class="logs">
		<code v-for="log in logs" :key="log.id" :class="log.level">
			<details>
				<summary><MkTime :time="log.createdAt"/> [{{ log.domain.join('.') }}] {{ log.message }}</summary>
				<!--<vue-json-pretty v-if="log.data" :data="log.data"></vue-json-pretty>-->
			</details>
		</code>
	</div>

	<MkButton @click="deleteAllLogs()" primary><Fa :icon="faTrashAlt"/> {{ $t('deleteAll') }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faStream } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkSelect from '@/components/ui/select.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkTextarea,
	},

	data() {
		return {
			INFO: {
				title: this.$t('serverLogs'),
				icon: faStream
			},
			logs: [],
			logLevel: 'all',
			logDomain: '',
			faTrashAlt,
		}
	},

	watch: {
		logLevel() {
			this.logs = [];
			this.fetchLogs();
		},
		logDomain() {
			this.logs = [];
			this.fetchLogs();
		}
	},

	created() {
		this.fetchLogs();
	},

	methods: {
		fetchLogs() {
			os.api('admin/logs', {
				level: this.logLevel === 'all' ? null : this.logLevel,
				domain: this.logDomain === '' ? null : this.logDomain,
				limit: 30
			}).then(logs => {
				this.logs = logs.reverse();
			});
		},

		deleteAllLogs() {
			os.apiWithDialog('admin/delete-logs');
		},
	}
});
</script>
