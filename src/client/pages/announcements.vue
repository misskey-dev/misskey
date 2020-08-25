<template>
<div>
	<portal to="header"><fa :icon="faBroadcastTower"/>{{ $t('announcements') }}</portal>

	<mk-pagination :pagination="pagination" #default="{items}" class="ruryvtyk" ref="list">
		<section class="_card announcement" v-for="(announcement, i) in items" :key="announcement.id">
			<div class="_title"><span v-if="$store.getters.isSignedIn && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
			<div class="_content">
				<mfm :text="announcement.text"/>
				<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
			</div>
			<div class="_footer" v-if="$store.getters.isSignedIn && !announcement.isRead">
				<mk-button @click="read(items, announcement, i)" primary><fa :icon="faCheck"/> {{ $t('gotIt') }}</mk-button>
			</div>
		</section>
	</mk-pagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCheck, faBroadcastTower } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../components/ui/pagination.vue';
import MkButton from '../components/ui/button.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('announcements') as string
		};
	},

	components: {
		MkPagination,
		MkButton
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
		// TODO: これは実質的に親コンポーネントから子コンポーネントのプロパティを変更してるのでなんとかしたい
		read(items, announcement, i) {
			Vue.set(items, i, {
				...announcement,
				isRead: true,
			});
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
