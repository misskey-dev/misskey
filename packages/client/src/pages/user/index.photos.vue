<template>
<MkContainer :max-height="300" :foldable="true">
	<template #header><i class="fas fa-image" style="margin-right: 0.5em;"></i>{{ $ts.images }}</template>
	<div class="ujigsodd">
		<MkLoading v-if="fetching"/>
		<div v-if="!fetching && images.length > 0" class="stream">
			<MkA
				v-for="image in images"
				:key="image.note.id + image.file.id"
				class="img"
				:to="notePage(image.note)"
			>
				<ImgWithBlurhash :hash="image.file.blurhash" :src="thumbnail(image.file)" :title="image.file.name"/>
			</MkA>
		</div>
		<p v-if="!fetching && images.length == 0" class="empty">{{ $ts.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { notePage } from '@/filters/note';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

let fetching = $ref(true);
let images = $ref<{
	note: misskey.entities.Note;
	file: misskey.entities.DriveFile;
}[]>([]);

function thumbnail(image: misskey.entities.DriveFile): string {
	return defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(image.thumbnailUrl)
		: image.thumbnailUrl;
}

onMounted(() => {
	const image = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/apng',
		'image/vnd.mozilla.apng',
	];
	os.api('users/notes', {
		userId: props.user.id,
		fileType: image,
		excludeNsfw: defaultStore.state.nsfw !== 'ignore',
		limit: 10,
	}).then(notes => {
		for (const note of notes) {
			for (const file of note.files) {
				images.push({
					note,
					file,
				});
			}
		}
		fetching = false;
	});
});
</script>

<style lang="scss" scoped>
.ujigsodd {
	padding: 8px;

	> .stream {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		grid-gap: 6px;

		> .img {
			height: 128px;
			border-radius: 6px;
			overflow: clip;
		}
	}

	> .empty {
		margin: 0;
		padding: 16px;
		text-align: center;

		> i {
			margin-right: 4px;
		}
	}
}
</style>
