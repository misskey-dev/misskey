<template>
	<span class="mk-avatar" :style="style" :class="{ cat }" :title="user | acct" v-if="disableLink && !disablePreview" v-user-preview="user.id" @click="onClick" v-once>
		<span class="inner" :style="icon"></span>
	</span>
	<span class="mk-avatar" :style="style" :class="{ cat }" :title="user | acct" v-else-if="disableLink && disablePreview" @click="onClick" v-once>
		<span class="inner" :style="icon"></span>
	</span>
	<router-link class="mk-avatar" :style="style" :class="{ cat }" :to="user | userPage" :title="user | acct" :target="target" v-else-if="!disableLink && !disablePreview" v-user-preview="user.id" v-once>
		<span class="inner" :style="icon"></span>
	</router-link>
	<router-link class="mk-avatar" :style="style" :class="{ cat }" :to="user | userPage" :title="user | acct" :target="target" v-else-if="!disableLink && disablePreview" v-once>
		<span class="inner" :style="icon"></span>
	</router-link>
</template>

<script lang="ts">
import Vue from 'vue';
import { getStaticImageUrl } from '../../../common/scripts/get-static-image-url';

export default Vue.extend({
	props: {
		user: {
			type: Object,
			required: true
		},
		target: {
			required: false,
			default: null
		},
		disableLink: {
			required: false,
			default: false
		},
		disablePreview: {
			required: false,
			default: false
		}
	},
	computed: {
		lightmode(): boolean {
			return this.$store.state.device.lightmode;
		},
		cat(): boolean {
			return this.user.isCat && this.$store.state.settings.circleIcons;
		},
		style(): any {
			return {
				borderRadius: this.$store.state.settings.circleIcons ? '100%' : null
			};
		},
		url(): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(this.user.avatarUrl)
				: this.user.avatarUrl;
		},
		icon(): any {
			return {
				backgroundColor: this.lightmode
					? `rgb(${this.user.avatarColor.slice(0, 3).join(',')})`
					: this.user.avatarColor && this.user.avatarColor.length == 3
						? `rgb(${this.user.avatarColor.join(',')})`
						: null,
				backgroundImage: this.lightmode ? null : `url(${this.url})`,
				borderRadius: this.$store.state.settings.circleIcons ? '100%' : null
			};
		}
	},
	mounted() {
		if (this.user.avatarColor) {
			this.$el.style.color = `rgb(${this.user.avatarColor.slice(0, 3).join(',')})`;
		}
	},
	methods: {
		onClick(e) {
			this.$emit('click', e);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-avatar
	display inline-block
	vertical-align bottom

	&:not(.cat)
		overflow hidden
		border-radius 8px

	&.cat::before,
	&.cat::after
		background #df548f
		border solid 4px currentColor
		box-sizing border-box
		content ''
		display inline-block
		height 50%
		width 50%

	&.cat::before
		border-radius 0 75% 75%
		transform rotate(37.5deg) skew(30deg)

	&.cat::after
		border-radius 75% 0 75% 75%
		transform rotate(-37.5deg) skew(-30deg)

	.inner
		background-position center center
		background-size cover
		bottom 0
		left 0
		position absolute
		right 0
		top 0
		transition border-radius 1s ease
		z-index 1

</style>
