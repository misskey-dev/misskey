<template>
<FormBase>
	<div class="_formItem">
		<div class="_formPanel hjiwjsqx">
			<span class="key">ID</span>
			<span class="value _monospace">{{ $store.state.i.id }}</span>
		</div>
	</div>

	<FormGroup>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">{{ $t('registeredDate') }}</span>
				<span class="value"><MkTime :time="$store.state.i.createdAt" mode="detail"/></span>
			</div>
		</div>
	</FormGroup>

	<FormGroup v-if="stats">
		<template #label>{{ $t('statistics') }}</template>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">{{ $t('notesCount') }}</span>
				<span class="value">{{ number(stats.notesCount) }}</span>
			</div>
		</div>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">{{ $t('followingCount') }}</span>
				<span class="value">{{ number(stats.followingCount) }}</span>
			</div>
		</div>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">{{ $t('followersCount') }}</span>
				<span class="value">{{ number(stats.followersCount) }}</span>
			</div>
		</div>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">{{ $t('sentReactionsCount') }}</span>
				<span class="value">{{ number(stats.sentReactionsCount) }}</span>
			</div>
		</div>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">{{ $t('receivedReactionsCount') }}</span>
				<span class="value">{{ number(stats.receivedReactionsCount) }}</span>
			</div>
		</div>
	</FormGroup>

	<FormGroup>
		<template #label>{{ $t('other') }}</template>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">twoFactorEnabled</span>
				<span class="value">{{ $store.state.i.twoFactorEnabled ? $t('yes') : $t('no') }}</span>
			</div>
		</div>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">securityKeys</span>
				<span class="value">{{ $store.state.i.securityKeys ? $t('yes') : $t('no') }}</span>
			</div>
		</div>
		<div class="_formItem">
			<div class="_formPanel hjiwjsqx">
				<span class="key">usePasswordLessLogin</span>
				<span class="value">{{ $store.state.i.usePasswordLessLogin ? $t('yes') : $t('no') }}</span>
			</div>
		</div>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';
import number from '@/filters/number';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('accountInfo'),
				icon: faEllipsisH
			},
			stats: null
		}
	},

	mounted() {
		this.$emit('info', this.INFO);

		os.api('users/stats', {
			userId: this.$store.state.i.id
		}).then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		number
	}
});
</script>

<style lang="scss" scoped>
.hjiwjsqx {
	display: flex;
	align-items: center;
	padding: 14px 16px;

	> .value {
		margin-left: auto;
		opacity: 0.7;
	}
}
</style>
