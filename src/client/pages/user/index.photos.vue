<template>
<MkContainer>
	<template #header><Fa :icon="faImage" style="margin-right: 0.5em;"/>{{ $t('images') }}</template>
	<div class="ujigsodd">
		<MkLoading v-if="fetching"/>
		<div class="stream" v-if="!fetching && images.length > 0">
			<MkA v-for="image in images"
				class="img"
				:style="`background-image: url(${thumbnail(image.file)})`"
				:to="notePage(image.note)"
			></MkA>
		</div>
		<p class="empty" v-if="!fetching && images.length == 0">{{ $t('nothing') }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import notePage from '../../filters/note';
import * as os from '@/os';
import MkContainer from '@/components/ui/container.vue';

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
			limit: 9,
		}).then(notes => {
			for (const note of notes) {
				for (const file of note.files) {
					if (this.images.length < 9) {
						this.images.push({
							note,
							file
						});
					}
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
		display: flex;
		justify-content: center;
		flex-wrap: wrap;

		> .img {
			flex: 1 1 33%;
			width: 33%;
			height: 90px;
			box-sizing: border-box;
			background-position: center center;
			background-size: cover;
			background-clip: content-box;
			border: solid 2px transparent;
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
