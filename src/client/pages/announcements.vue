<template>
<MkSpacer :content-max="800">
	<MkPagination :pagination="pagination" #default="{items}" class="ruryvtyk _content">
		<section class="_card announcement" v-for="(announcement, i) in items" :key="announcement.id">
			<div class="_title"><span v-if="$i && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
			<div class="_content">
				<Mfm :text="announcement.text"/>
				<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
			</div>
			<div class="_footer" v-if="$i && !announcement.isRead">
				<MkButton @click="read(items, announcement, i)" primary><i class="fas fa-check"></i> {{ $ts.gotIt }}</MkButton>
			</div>
		</section>
	</MkPagination>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkPagination,
		MkButton
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.announcements,
				icon: 'fas fa-broadcast-tower',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'announcements',
				limit: 10,
			},
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
		&:not(:last-child) {
			margin-bottom: var(--margin);
		}

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
