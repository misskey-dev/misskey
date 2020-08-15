<template>
<div v-if="channel">
	<portal to="icon"><fa :icon="faSatelliteDish"/></portal>
	<portal to="title">{{ channel.name }}</portal>

	<mk-container :body-togglable="true" :expanded="true">
		<template #header><fa :icon="faSatelliteDish" fixed-width/>{{ channel.name }}</template>

		<div class="wpgynlbz">
			<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" class="banner">
			</div>
		</div>
	</mk-container>

	<x-post-form class="post-form _panel" fixed/>

	<x-notes ref="notes" :pagination="pagination" @before="before" @after="after"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatelliteDish } from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import MkContainer from '../components/ui/container.vue';
import XPostForm from '../components/post-form.vue';
import XNotes from '../components/notes.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('channel') as string
		};
	},

	components: {
		MkContainer,
		XPostForm,
		XNotes,
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
			pagination: {
				endpoint: 'channels/timeline',
				limit: 10,
				params: () => ({
					channelId: this.channelId,
				})
			},
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
.wpgynlbz {
	> .banner {
		height: 100px;
		background-position: center;
		background-size: cover;
	}
}
</style>
