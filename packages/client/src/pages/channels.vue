<template>
<div>
	<div v-if="$i" class="_section" style="padding: 0;">
		<MkTab v-model="tab" class="_content">
			<option value="featured"><i class="fas fa-fire-alt"></i> {{ $ts._channel.featured }}</option>
			<option value="following"><i class="fas fa-heart"></i> {{ $ts._channel.following }}</option>
			<option value="owned"><i class="fas fa-edit"></i> {{ $ts._channel.owned }}</option>
		</MkTab>
	</div>

	<div class="_section">
		<div v-if="tab === 'featured'" class="_content grwlizim featured">
			<MkPagination v-slot="{items}" :pagination="featuredPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_gap" :channel="channel"/>
			</MkPagination>
		</div>

		<div v-if="tab === 'following'" class="_content grwlizim following">
			<MkPagination v-slot="{items}" :pagination="followingPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_gap" :channel="channel"/>
			</MkPagination>
		</div>

		<div v-if="tab === 'owned'" class="_content grwlizim owned">
			<MkButton class="new" @click="create()"><i class="fas fa-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :pagination="ownedPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_gap" :channel="channel"/>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkChannelPreview from '@/components/channel-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import MkTab from '@/components/tab.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkChannelPreview, MkPagination, MkButton, MkTab
	},
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.channel,
				icon: 'fas fa-satellite-dish',
				action: {
					icon: 'fas fa-plus',
					handler: this.create
				}
			},
			tab: 'featured',
			featuredPagination: {
				endpoint: 'channels/featured',
				noPaging: true,
			},
			followingPagination: {
				endpoint: 'channels/followed',
				limit: 5,
			},
			ownedPagination: {
				endpoint: 'channels/owned',
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
