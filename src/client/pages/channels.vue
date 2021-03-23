<template>
<div>
	<div class="_section" style="padding: 0;" v-if="$i">
		<MkTab class="_content" v-model:value="tab">
			<option value="featured"><Fa :icon="faFireAlt"/> {{ $ts._channel.featured }}</option>
			<option value="following"><Fa :icon="faHeart"/> {{ $ts._channel.following }}</option>
			<option value="owned"><Fa :icon="faEdit"/> {{ $ts._channel.owned }}</option>
		</MkTab>
	</div>

	<div class="_section">
		<div class="_content grwlizim featured" v-if="tab === 'featured'">
			<MkPagination :pagination="featuredPagination" #default="{items}">
				<MkChannelPreview v-for="channel in items" class="_vMargin" :channel="channel" :key="channel.id"/>
			</MkPagination>
		</div>

		<div class="_content grwlizim following" v-if="tab === 'following'">
			<MkPagination :pagination="followingPagination" #default="{items}">
				<MkChannelPreview v-for="channel in items" class="_vMargin" :channel="channel" :key="channel.id"/>
			</MkPagination>
		</div>

		<div class="_content grwlizim owned" v-if="tab === 'owned'">
			<MkButton class="new" @click="create()"><Fa :icon="faPlus"/></MkButton>
			<MkPagination :pagination="ownedPagination" #default="{items}">
				<MkChannelPreview v-for="channel in items" class="_vMargin" :channel="channel" :key="channel.id"/>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSatelliteDish, faPlus, faEdit, faFireAlt } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import MkChannelPreview from '@client/components/channel-preview.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkButton from '@client/components/ui/button.vue';
import MkTab from '@client/components/tab.vue';

export default defineComponent({
	components: {
		MkChannelPreview, MkPagination, MkButton, MkTab
	},
	data() {
		return {
			INFO: {
				title: this.$ts.channel,
				icon: faSatelliteDish,
				action: {
					icon: faPlus,
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
			faSatelliteDish, faPlus, faEdit, faHeart, faFireAlt
		};
	},
	methods: {
		create() {
			this.$router.push(`/channels/new`);
		}
	}
});
</script>
