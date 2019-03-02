<template>
<div>
	<ui-card>
		<template #title><fa :icon="faStream"/> {{ $t('logs') }}</template>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-input v-model="domain">
					<span>{{ $t('domain') }}</span>
				</ui-input>
				<ui-select v-model="level">
					<template #label>{{ $t('level') }}</template>
					<option value="all">{{ $t('levels.all') }}</option>
					<option value="info">{{ $t('levels.info') }}</option>
					<option value="success">{{ $t('levels.success') }}</option>
					<option value="warning">{{ $t('levels.warning') }}</option>
					<option value="error">{{ $t('levels.error') }}</option>
					<option value="debug">{{ $t('levels.debug') }}</option>
				</ui-select>
			</ui-horizon-group>

			<div class="nqjzuvev">
				<code v-for="log in logs" :key="log._id" :class="log.level">
					<mk-time :time="log.createdAt"/> [{{ log.domain.join(' ') }}] {{ log.message }}
				</code>
			</div>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faStream } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/logs.vue'),

	data() {
		return {
			logs: [],
			level: 'all',
			domain: '',
			faStream
		};
	},

	watch: {
		level() {
			this.logs = [];
			this.fetch();
		},

		domain() {
			this.logs = [];
			this.fetch();
		}
	},

	mounted() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.$root.api('admin/logs', {
				level: this.level === 'all' ? null : this.level,
				domain: this.domain === '' ? null : this.domain,
				limit: 50
			}).then(logs => {
				this.logs = logs;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.nqjzuvev
	white-space nowrap
	overflow auto
	padding 8px
	background #000
	color #fff

	> code
		display block

		&.error
			color #f00

		&.warning
			color #ff0

		&.success
			color #0f0

		&.debug
			opacity 0.7

</style>
