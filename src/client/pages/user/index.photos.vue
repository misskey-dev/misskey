<template>
<div class="ujigsodd">
	<mk-loading v-if="fetching"/>
	<div class="stream" v-if="!fetching && images.length > 0">
		<router-link v-for="(image, i) in images" :key="i"
			class="img"
			:style="`background-image: url(${thumbnail(image.file)})`"
			:to="notePage(image.note)"
		></router-link>
	</div>
	<p class="empty" v-if="!fetching && images.length == 0">{{ $t('nothing') }}</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import notePage from '../../filters/note';
import * as os from '@/os';

export default defineComponent({
	props: ['user'],
	data() {
		return {
			fetching: true,
			images: []
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
			excludeNsfw: !this.$store.state.device.alwaysShowNsfw,
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
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
		notePage
	},
});
</script>

<style lang="scss" scoped>
.ujigsodd {

	> .stream {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		padding: 8px;

		> .img {
			flex: 1 1 33%;
			width: 33%;
			height: 90px;
			box-sizing: border-box;
			background-position: center center;
			background-size: cover;
			background-clip: content-box;
			border: solid 2px transparent;
			border-radius: 4px;
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
