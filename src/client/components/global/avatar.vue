<template>
<span class="eiwwqkts _noSelect" :class="{ cat, square: $store.state.squareAvatars }" :title="acct(user)" v-if="disableLink" v-user-preview="disablePreview ? undefined : user.id" @click="onClick">
	<img class="inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="showIndicator" class="indicator" :user="user"/>
</span>
<MkA class="eiwwqkts _noSelect" :class="{ cat, square: $store.state.squareAvatars }" :to="userPage(user)" :title="acct(user)" :target="target" v-else v-user-preview="disablePreview ? undefined : user.id">
	<img class="inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="showIndicator" class="indicator" :user="user"/>
</MkA>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@client/scripts/get-static-image-url';
import { extractAvgColorFromBlurhash } from '@client/scripts/extract-avg-color-from-blurhash';
import { acct, userPage } from '@client/filters/user';
import MkUserOnlineIndicator from '@client/components/user-online-indicator.vue';

export default defineComponent({
	components: {
		MkUserOnlineIndicator
	},
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
		},
		showIndicator: {
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
			return this.$store.state.disableShowingAnimatedImages
				? getStaticImageUrl(this.user.avatarUrl)
				: this.user.avatarUrl;
		},
	},
	watch: {
		'user.avatarBlurhash'() {
			if (this.$el == null) return;
			this.$el.style.color = extractAvgColorFromBlurhash(this.user.avatarBlurhash);
		}
	},
	mounted() {
		this.$el.style.color = extractAvgColorFromBlurhash(this.user.avatarBlurhash);
	},
	methods: {
		onClick(e) {
			this.$emit('click', e);
		},
		acct,
		userPage
	}
});
</script>

<style lang="scss" scoped>
@keyframes earwiggleleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	25% { transform: rotate(10deg) skew(30deg); }
	50% { transform: rotate(20deg) skew(30deg); }
	75% { transform: rotate(0deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes earwiggleright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	30% { transform: rotate(-10deg) skew(-30deg); }
	55% { transform: rotate(-20deg) skew(-30deg); }
	75% { transform: rotate(0deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

.eiwwqkts {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;

	> .inner {
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

	> .indicator {
		position: absolute;
		z-index: 1;
		bottom: 0;
		left: 0;
		width: 20%;
		height: 20%;
	}

	&.square {
		border-radius: 20%;

		> .inner {
			border-radius: 20%;
		}
	}

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

		&:hover {
			&:before {
				animation: earwiggleleft 1s infinite;
			}

			&:after {
				animation: earwiggleright 1s infinite;
			}
		}
	}
}
</style>
