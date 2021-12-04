<template>
<MkContainer :max-height="300" :foldable="true">
	<template #header><i class="fas fa-image" style="margin-right: 0.5em;"></i>{{ $ts.images }}</template>
	<div class="ujigsodd">
		<MkLoading v-if="fetching"/>
		<div v-if="!fetching && images.length > 0" class="stream">
			<MkA v-for="image in images"
				:key="image.id"
				class="img"
				:to="notePage(image.note)"
			>
				<ImgWithBlurhash :hash="image.blurhash" :src="thumbnail(image.file)" :alt="image.name" :title="image.name"/>
			</MkA>
		</div>
		<p v-if="!fetching && images.length == 0" class="empty">{{ $ts.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { notePage } from '@/filters/note';
import * as os from '@/os';
import MkContainer from '@/components/ui/container.vue';
import ImgWithBlurhash from '@/components/img-with-blurhash.vue';

export default defineComponent({
	components: {
		MkContainer,
		ImgWithBlurhash,
	},
	props: {
		user: {
			type: Object,
			required: true
		},
	},
	data() {
		return {
			fetching: true,
			images: [],
		};
	},
	mounted() {
		const image = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/apng',
			'image/vnd.mozilla.apng',
		];
		os.api('users/notes', {
			userId: this.user.id,
			fileType: image,
			excludeNsfw: this.$store.state.nsfw !== 'ignore',
			limit: 10,
		}).then(notes => {
			for (const note of notes) {
				for (const file of note.files) {
					this.images.push({
						note,
						file
					});
				}
			}
			this.fetching = false;
		});
	},
	methods: {
		thumbnail(image: any): string {
			return this.$store.state.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
		notePage
	},
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
