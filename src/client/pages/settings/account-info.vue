<template>
<FormBase>
	<FormKeyValueView>
		<template #key>ID</template>
		<template #value><span class="_monospace">{{ $store.state.i.id }}</span></template>
	</FormKeyValueView>

	<FormGroup>
		<FormKeyValueView>
			<template #key>{{ $t('registeredDate') }}</template>
			<template #value><MkTime :time="$store.state.i.createdAt" mode="detail"/></template>
		</FormKeyValueView>
	</FormGroup>

	<FormGroup v-if="stats">
		<template #label>{{ $t('statistics') }}</template>
		<FormKeyValueView>
			<template #key>{{ $t('notesCount') }}</template>
			<template #value>{{ number(stats.notesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('repliesCount') }}</template>
			<template #value>{{ number(stats.repliesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('renotesCount') }}</template>
			<template #value>{{ number(stats.renotesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('repliedCount') }}</template>
			<template #value>{{ number(stats.repliedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('renotedCount') }}</template>
			<template #value>{{ number(stats.renotedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('pollVotesCount') }}</template>
			<template #value>{{ number(stats.pollVotesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('pollVotedCount') }}</template>
			<template #value>{{ number(stats.pollVotedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('sentReactionsCount') }}</template>
			<template #value>{{ number(stats.sentReactionsCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('receivedReactionsCount') }}</template>
			<template #value>{{ number(stats.receivedReactionsCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('followingCount') }}</template>
			<template #value>{{ number(stats.followingCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('followersCount') }}</template>
			<template #value>{{ number(stats.followersCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('driveFilesCount') }}</template>
			<template #value>{{ number(stats.driveFilesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $t('driveUsage') }}</template>
			<template #value>{{ bytes(stats.driveUsage) }}</template>
		</FormKeyValueView>
	</FormGroup>

	<FormGroup>
		<template #label>{{ $t('other') }}</template>
		<FormKeyValueView>
			<template #key>emailVerified</template>
			<template #value>{{ $store.state.i.emailVerified ? $t('yes') : $t('no') }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>twoFactorEnabled</template>
			<template #value>{{ $store.state.i.twoFactorEnabled ? $t('yes') : $t('no') }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>securityKeys</template>
			<template #value>{{ $store.state.i.securityKeys ? $t('yes') : $t('no') }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>usePasswordLessLogin</template>
			<template #value>{{ $store.state.i.usePasswordLessLogin ? $t('yes') : $t('no') }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>isModerator</template>
			<template #value>{{ $store.state.i.isModerator ? $t('yes') : $t('no') }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>isAdmin</template>
			<template #value>{{ $store.state.i.isAdmin ? $t('yes') : $t('no') }}</template>
		</FormKeyValueView>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import FormKeyValueView from '@/components/form/key-value-view.vue';
import * as os from '@/os';
import number from '@/filters/number';
import bytes from '@/filters/bytes';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
		FormKeyValueView,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('accountInfo'),
				icon: faInfoCircle
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
		number,
		bytes,
	}
});
</script>
