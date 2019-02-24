<template>
<ui-container :body-togglable="true"
	:expanded="$store.state.device.expandUsersPhotos"
	@toggle="expanded => $store.commit('device/set', { key: 'expandUsersPhotos', value: expanded })">
	<template #header><fa icon="camera"/> {{ $t('title') }}</template>

	<div class="dzsuvbsrrrwobdxifudxuefculdfiaxd">
		<p class="initializing" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('loading') }}<mk-ellipsis/></p>
		<div class="stream" v-if="!fetching && images.length > 0">
			<router-link v-for="image in images" class="img"
				:style="`background-image: url(${image.thumbnailUrl})`"
				:key="`${image.id}:${image._note.id}`"
				:to="image._note | notePage"
				:title="`${image.name}\n${(new Date(image.createdAt)).toLocaleString()}`"
			></router-link>
		</div>
		<p class="empty" v-if="!fetching && images.length == 0">{{ $t('no-photos') }}</p>
	</div>
</ui-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { getStaticImageUrl } from '../../../../common/scripts/get-static-image-url';
import { concat } from '../../../../../../prelude/array';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.photos.vue'),
	props: ['user'],
	data() {
		return {
			images: [],
			fetching: true
		};
	},
	mounted() {
		const image = [
			'image/jpeg',
			'image/png',
			'image/gif'
		];

		this.$root.api('users/notes', {
			userId: this.user.id,
			fileType: image,
			excludeNsfw: !this.$store.state.device.alwaysShowNsfw,
			limit: 9,
			untilDate: new Date().getTime() + 1000 * 86400 * 365
		}).then(notes => {
			for (const note of notes) {
				for (const file of note.files) {
					file._note = note;
				}
			}
			const files = concat(notes.map((n: any): any[] => n.files));
			this.images = files.filter(f => image.includes(f.type)).slice(0, 9);
			this.fetching = false;
		});
	},
	methods: {
		thumbnail(image: any): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(image.thumbnailUrl)
				: image.thumbnailUrl;
		},
	},
});
</script>

<style lang="stylus" scoped>
.dzsuvbsrrrwobdxifudxuefculdfiaxd
	> .stream
		display grid
		grid-template-columns 1fr 1fr 1fr
		gap 8px
		padding 16px
		background var(--face)

		> *
			height 120px
			background-position center center
			background-size cover
			background-clip content-box
			border-radius 4px

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> i
			margin-right 4px

</style>
