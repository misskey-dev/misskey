<template>
<button class="hdcaacmi _button"
	:class="{ wait, active: isFollowing, full }"
	@click="onClick"
	:disabled="wait"
>
	<template v-if="!wait">
		<template v-if="isFollowing">
			<span v-if="full">{{ $t('unfollow') }}</span><fa :icon="faMinus"/>
		</template>
		<template v-else>
			<span v-if="full">{{ $t('follow') }}</span><fa :icon="faPlus"/>
		</template>
	</template>
	<template v-else>
		<span v-if="full">{{ $t('processing') }}</span><fa :icon="faSpinner" pulse fixed-width/>
	</template>
</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSpinner, faPlus, faMinus, } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	props: {
		channel: {
			type: Object,
			required: true
		},
		full: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	data() {
		return {
			isFollowing: this.channel.isFollowing,
			wait: false,
			faSpinner, faPlus, faMinus,
		};
	},

	methods: {
		async onClick() {
			this.wait = true;

			try {
				if (this.isFollowing) {
					await this.$root.api('channels/unfollow', {
						channelId: this.channel.id
					});
					this.isFollowing = false;
				} else {
					await this.$root.api('channels/follow', {
						channelId: this.channel.id
					});
					this.isFollowing = true;
				}
			} catch (e) {
				console.error(e);
			} finally {
				this.wait = false;
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.hdcaacmi {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--accent);
	background: transparent;
	border: solid 1px var(--accent);
	padding: 0;
	height: 31px;
	font-size: 16px;
	border-radius: 32px;
	background: #fff;

	&.full {
		padding: 0 8px 0 12px;
		font-size: 14px;
	}

	&:not(.full) {
		width: 31px;
	}

	&:focus {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -5px;
			right: -5px;
			bottom: -5px;
			left: -5px;
			border: 2px solid var(--focus);
			border-radius: 32px;
		}
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: #fff;
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
			border-color: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
			border-color: var(--accentDarken);
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}

	> span {
		margin-right: 6px;
	}
}
</style>
