<template>
<MkContainer :max-height="300">
	<template #header><Fa :icon="faImage" style="margin-right: 0.5em;"/>{{ $ts.images }}</template>
	<div class="ujigsodd">
		<MkLoading v-if="fetching"/>
		<div class="stream" v-if="!fetching && images.length > 0">
			<MkA v-for="image in images"
				class="img"
				:style="`background-image: url(${thumbnail(image.file)})`"
				:to="notePage(image.note)"
				:key="image.id"
			></MkA>
		</div>
		<p class="empty" v-if="!fetching && images.length == 0">{{ $ts.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { getStaticImageUrl } from '@client/scripts/get-static-image-url';
import notePage from '../../filters/note';
import * as os from '@client/os';
import MkContainer from '@client/components/ui/container.vue';

export default defineComponent({
	components: {
		MkContainer,
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
			faImage
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
			background-position: center center;
			background-size: cover;
			background-clip: content-box;
			border-radius: 6px;
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
