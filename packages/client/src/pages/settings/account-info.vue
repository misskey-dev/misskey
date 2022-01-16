<template>
<div class="_formRoot">
	<MkKeyValue>
		<template #key>ID</template>
		<template #value><span class="_monospace">{{ $i.id }}</span></template>
	</MkKeyValue>

	<FormSection>
		<MkKeyValue>
			<template #key>{{ $ts.registeredDate }}</template>
			<template #value><MkTime :time="$i.createdAt" mode="detail"/></template>
		</MkKeyValue>
	</FormSection>

	<FormSection v-if="stats">
		<template #label>{{ $ts.statistics }}</template>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.notesCount }}</template>
			<template #value>{{ number(stats.notesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.repliesCount }}</template>
			<template #value>{{ number(stats.repliesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.renotesCount }}</template>
			<template #value>{{ number(stats.renotesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.repliedCount }}</template>
			<template #value>{{ number(stats.repliedCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.renotedCount }}</template>
			<template #value>{{ number(stats.renotedCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.pollVotesCount }}</template>
			<template #value>{{ number(stats.pollVotesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.pollVotedCount }}</template>
			<template #value>{{ number(stats.pollVotedCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.sentReactionsCount }}</template>
			<template #value>{{ number(stats.sentReactionsCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.receivedReactionsCount }}</template>
			<template #value>{{ number(stats.receivedReactionsCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.noteFavoritesCount }}</template>
			<template #value>{{ number(stats.noteFavoritesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.followingCount }}</template>
			<template #value>{{ number(stats.followingCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.followingCount }} ({{ $ts.local }})</template>
			<template #value>{{ number(stats.localFollowingCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.followingCount }} ({{ $ts.remote }})</template>
			<template #value>{{ number(stats.remoteFollowingCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.followersCount }}</template>
			<template #value>{{ number(stats.followersCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.followersCount }} ({{ $ts.local }})</template>
			<template #value>{{ number(stats.localFollowersCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.followersCount }} ({{ $ts.remote }})</template>
			<template #value>{{ number(stats.remoteFollowersCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.pageLikesCount }}</template>
			<template #value>{{ number(stats.pageLikesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.pageLikedCount }}</template>
			<template #value>{{ number(stats.pageLikedCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.driveFilesCount }}</template>
			<template #value>{{ number(stats.driveFilesCount) }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>{{ $ts.driveUsage }}</template>
			<template #value>{{ bytes(stats.driveUsage) }}</template>
		</MkKeyValue>
	</FormSection>

	<FormSection>
		<template #label>{{ $ts.other }}</template>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>emailVerified</template>
			<template #value>{{ $i.emailVerified ? $ts.yes : $ts.no }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>twoFactorEnabled</template>
			<template #value>{{ $i.twoFactorEnabled ? $ts.yes : $ts.no }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>securityKeys</template>
			<template #value>{{ $i.securityKeys ? $ts.yes : $ts.no }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>usePasswordLessLogin</template>
			<template #value>{{ $i.usePasswordLessLogin ? $ts.yes : $ts.no }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>isModerator</template>
			<template #value>{{ $i.isModerator ? $ts.yes : $ts.no }}</template>
		</MkKeyValue>
		<MkKeyValue oneline style="margin: 1em 0;">
			<template #key>isAdmin</template>
			<template #value>{{ $i.isAdmin ? $ts.yes : $ts.no }}</template>
		</MkKeyValue>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/key-value.vue';
import * as os from '@/os';
import number from '@/filters/number';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSection,
		MkKeyValue,
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
