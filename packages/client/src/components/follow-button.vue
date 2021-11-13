<template>
<button class="kpoogebi _button"
	:class="{ wait, active: isFollowing || hasPendingFollowRequestFromYou, full, large }"
	@click="onClick"
	:disabled="wait"
>
	<template v-if="!wait">
		<template v-if="hasPendingFollowRequestFromYou && user.isLocked">
			<span v-if="full">{{ $ts.followRequestPending }}</span><i class="fas fa-hourglass-half"></i>
		</template>
		<template v-else-if="hasPendingFollowRequestFromYou && !user.isLocked"> <!-- つまりリモートフォローの場合。 -->
			<span v-if="full">{{ $ts.processing }}</span><i class="fas fa-spinner fa-pulse"></i>
		</template>
		<template v-else-if="isFollowing">
			<span v-if="full">{{ $ts.unfollow }}</span><i class="fas fa-minus"></i>
		</template>
		<template v-else-if="!isFollowing && user.isLocked">
			<span v-if="full">{{ $ts.followRequest }}</span><i class="fas fa-plus"></i>
		</template>
		<template v-else-if="!isFollowing && !user.isLocked">
			<span v-if="full">{{ $ts.follow }}</span><i class="fas fa-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full">{{ $ts.processing }}</span><i class="fas fa-spinner fa-pulse fa-fw"></i>
	</template>
</button>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		user: {
			type: Object,
			required: true
		},
		full: {
			type: Boolean,
			required: false,
			default: false,
		},
		large: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	data() {
		return {
			isFollowing: this.user.isFollowing,
			hasPendingFollowRequestFromYou: this.user.hasPendingFollowRequestFromYou,
			wait: false,
			connection: null,
		};
	},

	created() {
		// 渡されたユーザー情報が不完全な場合
		if (this.user.isFollowing == null) {
			os.api('users/show', {
				userId: this.user.id
			}).then(u => {
				this.isFollowing = u.isFollowing;
				this.hasPendingFollowRequestFromYou = u.hasPendingFollowRequestFromYou;
			});
		}
	},

	mounted() {
		this.connection = markRaw(os.stream.useChannel('main'));

		this.connection.on('follow', this.onFollowChange);
		this.connection.on('unfollow', this.onFollowChange);
	},

	beforeUnmount() {
		this.connection.dispose();
	},

	methods: {
		onFollowChange(user) {
			if (user.id == this.user.id) {
				this.isFollowing = user.isFollowing;
				this.hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
			}
		},

		async onClick() {
			this.wait = true;

			try {
				if (this.isFollowing) {
					const { canceled } = await os.dialog({
						type: 'warning',
						text: this.$t('unfollowConfirm', { name: this.user.name || this.user.username }),
						showCancelButton: true
					});

					if (canceled) return;

					await os.api('following/delete', {
						userId: this.user.id
					});
				} else {
					if (this.hasPendingFollowRequestFromYou) {
						await os.api('following/requests/cancel', {
							userId: this.user.id
						});
					} else if (this.user.isLocked) {
						await os.api('following/create', {
							userId: this.user.id
						});
						this.hasPendingFollowRequestFromYou = true;
					} else {
						await os.api('following/create', {
							userId: this.user.id
						});
						this.hasPendingFollowRequestFromYou = true;
					}
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
.kpoogebi {
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

	&.large {
		font-size: 16px;
		height: 38px;
		padding: 0 12px 0 16px;
	}

	&:not(.full) {
		width: 31px;
	}

	&:focus-visible {
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
