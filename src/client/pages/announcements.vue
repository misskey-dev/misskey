<template>
<div>
	<portal to="icon"><fa :icon="faBroadcastTower"/></portal>
	<portal to="title">{{ $t('announcements') }}</portal>

	<x-pagination :pagination="pagination" #default="{items}" class="ruryvtyk" ref="list">
		<section class="_section announcement" v-for="(announcement, i) in items" :key="announcement.id" :data-index="i">
			<div class="_title"><span v-if="!announcement.isRead">🆕 </span>{{ announcement.title }}</div>
			<div class="_content">
				<mfm :text="announcement.text"/>
				<img v-if="announcement.imageUrl" :src="announcement.imageUrl" alt=""/>
			</div>
			<div class="_footer" v-if="!announcement.isRead">
				<x-button @click="read(announcement)" primary><fa :icon="faCheck"/> {{ $t('gotIt') }}</x-button>
			</div>
		</section>
	</x-pagination>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCheck, faBroadcastTower } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import XPagination from '../components/ui/pagination.vue';
import XButton from '../components/ui/button.vue';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('announcements') as string
		};
	},

	components: {
		XPagination,
		XButton
	},

	data() {
		return {
			pagination: {
				endpoint: 'announcements',
				limit: 10,
			},
			faCheck, faBroadcastTower
		};
	},

	methods: {
		read(announcement) {
			announcement.isRead = true;
			this.$root.api('i/read-announcement', { announcementId: announcement.id });
		},
	}
});
</script>

<style lang="scss" scoped>
.ruryvtyk {
	> .announcement {
		> ._content {
			> img {
				display: block;
				max-height: 300px;
				max-width: 100%;
			}
		}
	}
}
</style>
