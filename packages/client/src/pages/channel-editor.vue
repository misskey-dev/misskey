<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div class="_formRoot">
			<MkInput v-model="name" class="_formBlock">
				<template #label>{{ i18n.ts.name }}</template>
			</MkInput>

			<MkTextarea v-model="description" class="_formBlock">
				<template #label>{{ i18n.ts.description }}</template>
			</MkTextarea>

			<div class="banner">
				<MkButton v-if="bannerId == null" @click="setBannerImage"><i class="fas fa-plus"></i> {{ i18n.ts._channel.setBanner }}</MkButton>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<MkButton @click="removeBannerImage()"><i class="fas fa-trash-alt"></i> {{ i18n.ts._channel.removeBanner }}</MkButton>
				</div>
			</div>
			<div class="_formBlock">
				<MkButton primary @click="save()"><i class="fas fa-save"></i> {{ channelId ? i18n.ts.save : i18n.ts.create }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, inject, watch } from 'vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/form/input.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const router = useRouter();

const props = defineProps<{
	channelId?: string;
}>();

let channel = $ref(null);
let name = $ref(null);
let description = $ref(null);
let bannerUrl = $ref<string | null>(null);
let bannerId = $ref<string | null>(null);

watch(() => bannerId, async () => {
	if (bannerId == null) {
		bannerUrl = null;
	} else {
		bannerUrl = (await os.api('drive/files/show', {
			fileId: bannerId,
		})).url;
	}
});

async function fetchChannel() {
	if (props.channelId == null) return;

	channel = await os.api('channels/show', {
		channelId: props.channelId,
	});

	name = channel.name;
	description = channel.description;
	bannerId = channel.bannerId;
	bannerUrl = channel.bannerUrl;
}

fetchChannel();

function save() {
	const params = {
		name: name,
		description: description,
		bannerId: bannerId,
	};

	if (props.channelId) {
		params.channelId = props.channelId;
		os.api('channels/update', params).then(() => {
			os.success();
		});
	} else {
		os.api('channels/create', params).then(created => {
			os.success();
			router.push(`/channels/${created.id}`);
		});
	}
}

function setBannerImage(evt) {
	selectFile(evt.currentTarget ?? evt.target, null).then(file => {
		bannerId = file.id;
	});
}

function removeBannerImage() {
	bannerId = null;
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => props.channelId ? {
	title: i18n.ts._channel.edit,
	icon: 'fas fa-satellite-dish',
} : {
	title: i18n.ts._channel.create,
	icon: 'fas fa-satellite-dish',
}));
</script>

<style lang="scss" scoped>

</style>
