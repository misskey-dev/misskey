<template>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" :style="style" v-if="disablePreview"></router-link>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" :style="style" v-else v-user-preview="user.id"></router-link>
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
		disablePreview: {
			required: false,
			default: false
		}
	},
	computed: {
		lightmode(): boolean {
			return this.$store.state.device.lightmode;
		},
		style(): any {
			return {
				backgroundColor: this.lightmode
					? `rgb(${ this.user.avatarColor.slice(0, 3).join(',') })`
					: this.user.avatarColor && this.user.avatarColor.length == 3
						? `rgb(${ this.user.avatarColor.join(',') })`
						: null,
				backgroundImage: this.lightmode ? null : `url(${ this.user.avatarUrl }?thumbnail)`,
				borderRadius: this.$store.state.settings.circleIcons ? '100%' : null
			};
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-avatar
	display inline-block
	vertical-align bottom
	background-size cover
	background-position center center
	transition border-radius 1s ease
</style>
