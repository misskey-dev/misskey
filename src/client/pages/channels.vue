<template>
<div>
	<portal to="icon"><fa :icon="faSatelliteDish"/></portal>
	<portal to="title">{{ $t('channel') }}</portal>

	<mk-tab v-model="tab" :items="[{ label: $t('_channel.featured'), value: 'featured', icon: faFireAlt }, { label: $t('_channel.following'), value: 'following', icon: faHeart }, { label: $t('_channel.owned'), value: 'owned', icon: faEdit }]"/>

	<div class="grwlizim featured" v-if="tab === 'featured'">
		<mk-pagination :pagination="featuredPagination" #default="{items}">
			<mk-channel-preview v-for="channel in items" class="uveselbe" :channel="channel" :key="channel.id"/>
		</mk-pagination>
	</div>

	<div class="grwlizim following" v-if="tab === 'following'">
		<mk-pagination :pagination="followingPagination" #default="{items}">
			<mk-channel-preview v-for="channel in items" class="uveselbe" :channel="channel" :key="channel.id"/>
		</mk-pagination>
	</div>

	<div class="grwlizim owned" v-if="tab === 'owned'">
		<mk-button class="new" @click="create()"><fa :icon="faPlus"/></mk-button>
		<mk-pagination :pagination="ownedPagination" #default="{items}">
			<mk-channel-preview v-for="channel in items" class="uveselbe" :channel="channel" :key="channel.id"/>
		</mk-pagination>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatelliteDish, faPlus, faEdit, faFireAlt } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import MkChannelPreview from '../components/channel-preview.vue';
import MkPagination from '../components/ui/pagination.vue';
import MkButton from '../components/ui/button.vue';
import MkTab from '../components/tab.vue';

export default Vue.extend({
	components: {
		MkChannelPreview, MkPagination, MkButton, MkTab
	},
	data() {
		return {
			tab: 'featured',
			featuredPagination: {
				endpoint: 'channels/featured',
				limit: 5,
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

<style lang="scss" scoped>
.grwlizim {
	padding: 16px 0;

	&.my .uveselbe:first-child {
		margin-top: 16px;
	}

	.uveselbe:not(:last-child) {
		margin-bottom: 8px;
	}

	@media (min-width: 500px) {
		.uveselbe:not(:last-child) {
			margin-bottom: 16px;
		}
	}
}
</style>
