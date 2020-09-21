<template>
<span class="eiwwqkts" :class="{ cat }" :title="acct(user)" v-if="disableLink" @click="onClick">
	<img class="inner" :src="url"/>
</span>
<router-link class="eiwwqkts" :class="{ cat }" :to="userPage(user)" :title="acct(user)" :target="target" v-else>
	<img class="inner" :src="url"/>
</router-link>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { UserPreview } from '@/scripts/user-preview';
import { acct, userPage } from '../filters/user';
import * as os from '@/os';

export default defineComponent({
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
	emits: ['click'],
	computed: {
		cat(): boolean {
			return this.user.isCat;
		},
		url(): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(this.user.avatarUrl)
				: this.user.avatarUrl;
		},
	},
	watch: {
		'user.avatarBlurhash'() {
			this.$el.style.color = this.getBlurhashAvgColor(this.user.avatarBlurhash);
		}
	},
	mounted() {
		this.$el.style.color = this.getBlurhashAvgColor(this.user.avatarBlurhash);

		if (!this.disablePreview) {
			new UserPreview(this.$el, this.user.id);
		}
	},
	methods: {
		getBlurhashAvgColor(s) {
			return typeof s == 'string'
				? '#' + [...s.slice(2, 6)]
						.map(x => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'.indexOf(x))
						.reduce((a, c) => a * 83 + c, 0)
						.toString(16)
						.padStart(6, '0')
				: undefined;
		},
		onClick(e) {
			this.$emit('click', e);
		},
		acct,
		userPage
	}
});
</script>

<style lang="scss" scoped>
.eiwwqkts {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;

	&.cat {
		&:before, &:after {
			background: #df548f;
			border: solid 4px currentColor;
			box-sizing: border-box;
			content: '';
			display: inline-block;
			height: 50%;
			width: 50%;
		}

		&:before {
			border-radius: 0 75% 75%;
			transform: rotate(37.5deg) skew(30deg);
		}

		&:after {
			border-radius: 75% 0 75% 75%;
			transform: rotate(-37.5deg) skew(-30deg);
		}
	}

	.inner {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		top: 0;
		border-radius: 100%;
		z-index: 1;
		overflow: hidden;
		object-fit: cover;
		width: 100%;
		height: 100%;
	}
}
</style>
