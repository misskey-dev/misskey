<template>
<div>
	<portal to="icon"><fa :icon="faBell"/></portal>
	<portal to="title" v-t="'notifications'"></portal>
	<x-notifications @before="before" @after="after" page/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import Progress from '../scripts/loading';
import XNotifications from '../components/notifications.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('notifications') as string
		};
	},

	components: {
		XNotifications
	},

	data() {
		return {
			faBell
		};
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		}
	}
});
</script>
