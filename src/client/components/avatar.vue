<template>
	<span class="mk-avatar" :title="user | acct" v-if="disableLink && !disablePreview" v-user-preview="user.id" @click="onClick" v-once>
		<span class="inner" :style="icon"></span>
	</span>
	<span class="mk-avatar" :title="user | acct" v-else-if="disableLink && disablePreview" @click="onClick" v-once>
		<span class="inner" :style="icon"></span>
	</span>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" v-else-if="!disableLink && !disablePreview" v-user-preview="user.id" v-once>
		<span class="inner" :style="icon"></span>
	</router-link>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" v-else-if="!disableLink && disablePreview" v-once>
		<span class="inner" :style="icon"></span>
	</router-link>
</template>

<script lang="ts">
import Vue from 'vue';
import { getStaticImageUrl } from '../scripts/get-static-image-url';

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
		url(): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(this.user.avatarUrl)
				: this.user.avatarUrl;
		},
		icon(): any {
			return {
				backgroundImage: `url(${this.url})`,
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

<style lang="scss" scoped>
.mk-avatar {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	overflow: hidden;
	border-radius: 100%;
	
	.inner {
		background-position: center center;
		background-size: cover;
		bottom: 0;
		left: 0;
		position: absolute;
		right: 0;
		top: 0;
		border-radius: 100%;
		z-index: 1;
	}
}
</style>
