<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkPagination v-slot="{items, reload}" :pagination="pagination" class="ruryvtyk _gaps_m">
			<section v-for="(announcement, i) in items" :key="announcement.id" :class="{ announcement: true, _panel: true, private: announcement.isPrivate }">
				<div class="header"><span v-if="$i && !announcement.isRead"><span class="ti ti-speakerphone"></span></span><Mfm :text="announcement.title"/></div>
				<div class="content">
					<Mfm :text="announcement.text"/>
					<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
				</div>
				<div v-if="$i && !announcement.isRead" class="footer">
					<MkButton primary @click="read(items, reload, announcement, i)"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
				</div>
			</section>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const pagination = {
	endpoint: 'announcements' as const,
	offsetMode: true,
	limit: 10,
};

function read(items, reload, announcement, i) {
	items[i].isRead = true;
	os.api('i/read-announcement', {
		announcementId: announcement.id,
	}).then(reload);
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
});
</script>

<style lang="scss" scoped>
.ruryvtyk {

	> .private {
		border-left: 4px solid olivedrab;
	}

	> .announcement {
		padding: 16px;

		> .header {
			margin-bottom: 16px;
			font-weight: bold;
		}

		> .content {
			> img {
				display: block;
				max-height: 300px;
				max-width: 100%;
			}
		}

		> .footer {
			margin-top: 16px;
		}
	}
}

@keyframes fade {
	0% {
		opacity: 0;
	}
	50% {
		opacity: 1;
	}
	100% {
		opacity: 0;
	}
}
</style>
