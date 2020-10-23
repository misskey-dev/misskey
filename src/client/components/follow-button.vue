<template>
<button class="kpoogebi _button"
	:class="{ wait, active: isFollowing || hasPendingFollowRequestFromYou, full }"
	@click="onClick"
	:disabled="wait"
	v-if="isFollowing != null && !(isNotification && isFollowing)"
>
	<template v-if="!wait">
		<template v-if="hasPendingFollowRequestFromYou && user.isLocked">
			<span v-if="full">{{ $t('followRequestPending') }}</span><Fa :icon="faHourglassHalf"/>
		</template>
		<template v-else-if="hasPendingFollowRequestFromYou && !user.isLocked"> <!-- つまりリモートフォローの場合。 -->
			<span v-if="full">{{ $t('processing') }}</span><Fa :icon="faSpinner" pulse/>
		</template>
		<template v-else-if="isFollowing">
			<span v-if="full">{{ $t('unfollow') }}</span><Fa :icon="faMinus"/>
		</template>
		<template v-else-if="!isFollowing && user.isLocked">
			<span v-if="full">{{ $t('followRequest') }}</span><Fa :icon="faPlus"/>
		</template>
		<template v-else-if="!isFollowing && !user.isLocked">
			<span v-if="full">{{ $t('follow') }}</span><Fa :icon="faPlus"/>
		</template>
	</template>
	<template v-else>
		<span v-if="full">{{ $t('processing') }}</span><Fa :icon="faSpinner" pulse fixed-width/>
	</template>
</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSpinner, faPlus, faMinus, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
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
		isNotification: {
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
			faSpinner, faPlus, faMinus, faHourglassHalf
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
		this.connection = os.stream.useSharedConnection('main');

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
