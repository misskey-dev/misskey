<template>
	<span class="mk-avatar" :class="{ cat }" :title="user | acct" v-if="disableLink && !disablePreview" v-user-preview="user.id" @click="onClick">
		<span class="inner" :style="style"></span>
	</span>
	<span class="mk-avatar" :class="{ cat }" :title="user | acct" v-else-if="disableLink && disablePreview" @click="onClick">
		<span class="inner" :style="style"></span>
	</span>
	<router-link class="mk-avatar" :class="{ cat }" :to="user | userPage" :title="user | acct" :target="target" v-else-if="!disableLink && !disablePreview" v-user-preview="user.id">
		<span class="inner" :style="style"></span>
	</router-link>
	<router-link class="mk-avatar" :class="{ cat }" :to="user | userPage" :title="user | acct" :target="target" v-else-if="!disableLink && disablePreview">
		<span class="inner" :style="style"></span>
	</router-link>
</template>

<script lang="ts">
import Vue from 'vue';
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
				backgroundColor: this.lightmode
					? `rgb(${ this.user.avatarColor.slice(0, 3).join(',') })`
					: this.user.avatarColor && this.user.avatarColor.length == 3
						? `rgb(${ this.user.avatarColor.join(',') })`
						: null,
				backgroundImage: this.lightmode ? null : `url(${ this.user.avatarUrl })`,
				borderRadius: this.$store.state.settings.circleIcons ? '100%' : null
			};
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

	&.cat::before,
	&.cat::after
		background #df548f
		border solid 4px #ffffff
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
