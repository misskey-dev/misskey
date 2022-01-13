<template>
<MkSpacer :content-max="800">
	<MkPagination v-slot="{items}" :pagination="pagination" class="ruryvtyk _content">
		<section v-for="(announcement, i) in items" :key="announcement.id" class="_card announcement">
			<div class="_title"><span v-if="$i && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
			<div class="_content">
				<Mfm :text="announcement.text"/>
				<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
			</div>
			<div v-if="$i && !announcement.isRead" class="_footer">
				<MkButton primary @click="read(items, announcement, i)"><i class="fas fa-check"></i> {{ $ts.gotIt }}</MkButton>
			</div>
		</section>
	</MkPagination>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
				endpoint: 'announcements' as const,
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
