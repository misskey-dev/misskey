<template>
<MkSpacer :content-max="700">
	<div v-if="tab === 'featured'" class="_content grwlizim featured">
		<MkPagination v-slot="{items}" :pagination="featuredPagination">
			<MkChannelPreview v-for="channel in items" :key="channel.id" class="_gap" :channel="channel"/>
		</MkPagination>
	</div>
	<div v-else-if="tab === 'following'" class="_content grwlizim following">
		<MkPagination v-slot="{items}" :pagination="followingPagination">
			<MkChannelPreview v-for="channel in items" :key="channel.id" class="_gap" :channel="channel"/>
		</MkPagination>
	</div>
	<div v-else-if="tab === 'owned'" class="_content grwlizim owned">
		<MkButton class="new" @click="create()"><i class="fas fa-plus"></i></MkButton>
		<MkPagination v-slot="{items}" :pagination="ownedPagination">
			<MkChannelPreview v-for="channel in items" :key="channel.id" class="_gap" :channel="channel"/>
		</MkPagination>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkChannelPreview from '@/components/channel-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkChannelPreview, MkPagination, MkButton,
	},
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.channel,
				icon: 'fas fa-satellite-dish',
				bg: 'var(--bg)',
				actions: [{
					icon: 'fas fa-plus',
					text: this.$ts.create,
					handler: this.create,
				}],
				tabs: [{
					active: this.tab === 'featured',
					title: this.$ts._channel.featured,
					icon: 'fas fa-fire-alt',
					onClick: () => { this.tab = 'featured'; },
				}, {
					active: this.tab === 'following',
					title: this.$ts._channel.following,
					icon: 'fas fa-heart',
					onClick: () => { this.tab = 'following'; },
				}, {
					active: this.tab === 'owned',
					title: this.$ts._channel.owned,
					icon: 'fas fa-edit',
					onClick: () => { this.tab = 'owned'; },
				},]
			})),
			tab: 'featured',
			featuredPagination: {
				endpoint: 'channels/featured' as const,
				noPaging: true,
			},
			followingPagination: {
				endpoint: 'channels/followed' as const,
				limit: 5,
			},
			ownedPagination: {
				endpoint: 'channels/owned' as const,
				limit: 5,
			},
		};
	},
	methods: {
		create() {
			this.$router.push(`/channels/new`);
		}
	}
});
</script>
