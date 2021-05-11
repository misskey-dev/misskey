<template>
<div class="_section">
	<div class="_inputs">
		<MkInput v-model:value="logDomain" :debounce="true">
			<span>{{ $ts.domain }}</span>
		</MkInput>
		<MkSelect v-model:value="logLevel">
			<template #label>Level</template>
			<option value="all">All</option>
			<option value="info">Info</option>
			<option value="success">Success</option>
			<option value="warning">Warning</option>
			<option value="error">Error</option>
			<option value="debug">Debug</option>
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

	<MkButton @click="deleteAllLogs()" primary><i class="fas fa-trash-alt"></i> {{ $ts.deleteAll }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkTextarea,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.serverLogs,
				icon: 'fas fa-stream'
			},
			logs: [],
			logLevel: 'all',
			logDomain: '',
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

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
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
