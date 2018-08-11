<template>
	<span class="mk-avatar" :title="user | acct" :style="style" v-if="disableLink && !disablePreview" v-user-preview="user.id" @click="onClick"></span>
	<span class="mk-avatar" :title="user | acct" :style="style" v-else-if="disableLink && disablePreview" @click="onClick"></span>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" :style="style" v-else-if="!disableLink && !disablePreview" v-user-preview="user.id"></router-link>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" :style="style" v-else-if="!disableLink && disablePreview"></router-link>
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
	background-size cover
	background-position center center
	transition border-radius 1s ease
</style>
