<template>
<div class="_section">
	<MkPagination :pagination="pagination" #default="{items}" class="ruryvtyk _content" ref="list">
		<section class="_card announcement" v-for="(announcement, i) in items" :key="announcement.id">
			<div class="_title"><span v-if="$store.getters.isSignedIn && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
			<div class="_content">
				<Mfm :text="announcement.text"/>
				<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
			</div>
			<div class="_footer" v-if="$store.getters.isSignedIn && !announcement.isRead">
				<MkButton @click="read(items, announcement, i)" primary><Fa :icon="faCheck"/> {{ $t('gotIt') }}</MkButton>
			</div>
		</section>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCheck, faBroadcastTower } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkPagination,
		MkButton
	},

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('announcements'),
					icon: faBroadcastTower
				}]
			},
			pagination: {
				endpoint: 'announcements',
				limit: 10,
			},
			faCheck,
		};
	},

	methods: {
		// TODO: これは実質的に親コンポーネントから子コンポーネントのプロパティを変更してるのでなんとかしたい
		read(items, announcement, i) {
			items[i] = {
				...announcement,
				isRead: true,
			};
			os.api('i/read-announcement', { announcementId: announcement.id });
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
