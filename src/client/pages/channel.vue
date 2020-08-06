<template>
<div v-if="channel">
	<portal to="icon"><fa :icon="faSatelliteDish"/></portal>
	<portal to="title">{{ channel.name }}</portal>

	<mk-container :body-togglable="true" :expanded="true">
		<template #header><fa :icon="faSatelliteDish" fixed-width/>{{ channel.name }}</template>

		<div>
			<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }">
			</div>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatelliteDish } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import MkContainer from '../components/ui/container.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('channel') as string
		};
	},

	components: {
		MkContainer,
	},

	props: {
		channelId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			channel: null,
			faSatelliteDish,
		};
	},

	watch: {
		channelId: {
			async handler() {
				this.channel = await this.$root.api('channels/show', {
					channelId: this.channelId,
				});
			},
			immediate: true
		}
	},

	created() {

	},
});
</script>

<style lang="scss" scoped>
</style>
