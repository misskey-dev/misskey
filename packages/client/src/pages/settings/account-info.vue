<template>
<FormBase>
	<FormKeyValueView>
		<template #key>ID</template>
		<template #value><span class="_monospace">{{ $i.id }}</span></template>
	</FormKeyValueView>

	<FormGroup>
		<FormKeyValueView>
			<template #key>{{ $ts.registeredDate }}</template>
			<template #value><MkTime :time="$i.createdAt" mode="detail"/></template>
		</FormKeyValueView>
	</FormGroup>

	<FormGroup v-if="stats">
		<template #label>{{ $ts.statistics }}</template>
		<FormKeyValueView>
			<template #key>{{ $ts.notesCount }}</template>
			<template #value>{{ number(stats.notesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.repliesCount }}</template>
			<template #value>{{ number(stats.repliesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.renotesCount }}</template>
			<template #value>{{ number(stats.renotesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.repliedCount }}</template>
			<template #value>{{ number(stats.repliedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.renotedCount }}</template>
			<template #value>{{ number(stats.renotedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.pollVotesCount }}</template>
			<template #value>{{ number(stats.pollVotesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.pollVotedCount }}</template>
			<template #value>{{ number(stats.pollVotedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.sentReactionsCount }}</template>
			<template #value>{{ number(stats.sentReactionsCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.receivedReactionsCount }}</template>
			<template #value>{{ number(stats.receivedReactionsCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.noteFavoritesCount }}</template>
			<template #value>{{ number(stats.noteFavoritesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.followingCount }}</template>
			<template #value>{{ number(stats.followingCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.followingCount }} ({{ $ts.local }})</template>
			<template #value>{{ number(stats.localFollowingCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.followingCount }} ({{ $ts.remote }})</template>
			<template #value>{{ number(stats.remoteFollowingCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.followersCount }}</template>
			<template #value>{{ number(stats.followersCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.followersCount }} ({{ $ts.local }})</template>
			<template #value>{{ number(stats.localFollowersCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.followersCount }} ({{ $ts.remote }})</template>
			<template #value>{{ number(stats.remoteFollowersCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.pageLikesCount }}</template>
			<template #value>{{ number(stats.pageLikesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.pageLikedCount }}</template>
			<template #value>{{ number(stats.pageLikedCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.driveFilesCount }}</template>
			<template #value>{{ number(stats.driveFilesCount) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.driveUsage }}</template>
			<template #value>{{ bytes(stats.driveUsage) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.reversiCount }}</template>
			<template #value>{{ number(stats.reversiCount) }}</template>
		</FormKeyValueView>
	</FormGroup>

	<FormGroup>
		<template #label>{{ $ts.other }}</template>
		<FormKeyValueView>
			<template #key>emailVerified</template>
			<template #value>{{ $i.emailVerified ? $ts.yes : $ts.no }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>twoFactorEnabled</template>
			<template #value>{{ $i.twoFactorEnabled ? $ts.yes : $ts.no }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>securityKeys</template>
			<template #value>{{ $i.securityKeys ? $ts.yes : $ts.no }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>usePasswordLessLogin</template>
			<template #value>{{ $i.usePasswordLessLogin ? $ts.yes : $ts.no }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>isModerator</template>
			<template #value>{{ $i.isModerator ? $ts.yes : $ts.no }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>isAdmin</template>
			<template #value>{{ $i.isAdmin ? $ts.yes : $ts.no }}</template>
		</FormKeyValueView>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import * as os from '@/os';
import number from '@/filters/number';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';

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
			[symbols.PAGE_INFO]: {
				title: this.$ts.accountInfo,
				icon: 'fas fa-info-circle'
			},
			stats: null
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);

		os.api('users/stats', {
			userId: this.$i.id
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
