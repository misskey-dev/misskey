<template>
<MkModal ref="modal" :z-priority="'high'" :src="src" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div class="gqyayizv _popup">
		<button key="public" class="_button" :class="{ active: v == 'public' }" data-index="1" @click="choose('public')">
			<div><i class="fas fa-globe"></i></div>
			<div>
				<span>{{ $ts._visibility.public }}</span>
				<span>{{ $ts._visibility.publicDescription }}</span>
			</div>
		</button>
		<button key="home" class="_button" :class="{ active: v == 'home' }" data-index="2" @click="choose('home')">
			<div><i class="fas fa-home"></i></div>
			<div>
				<span>{{ $ts._visibility.home }}</span>
				<span>{{ $ts._visibility.homeDescription }}</span>
			</div>
		</button>
		<button key="followers" class="_button" :class="{ active: v == 'followers' }" data-index="3" @click="choose('followers')">
			<div><i class="fas fa-unlock"></i></div>
			<div>
				<span>{{ $ts._visibility.followers }}</span>
				<span>{{ $ts._visibility.followersDescription }}</span>
			</div>
		</button>
		<button key="specified" :disabled="localOnly" class="_button" :class="{ active: v == 'specified' }" data-index="4" @click="choose('specified')">
			<div><i class="fas fa-envelope"></i></div>
			<div>
				<span>{{ $ts._visibility.specified }}</span>
				<span>{{ $ts._visibility.specifiedDescription }}</span>
			</div>
		</button>
		<div class="divider"></div>
		<button key="localOnly" class="_button localOnly" :class="{ active: localOnly }" data-index="5" @click="localOnly = !localOnly">
			<div><i class="fas fa-biohazard"></i></div>
			<div>
				<span>{{ $ts._visibility.localOnly }}</span>
				<span>{{ $ts._visibility.localOnlyDescription }}</span>
			</div>
			<div><i :class="localOnly ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i></div>
		</button>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@/components/ui/modal.vue';

export default defineComponent({
	components: {
		MkModal,
	},
	props: {
		currentVisibility: {
			type: String,
			required: true
		},
		currentLocalOnly: {
			type: Boolean,
			required: true
		},
		src: {
			required: false
		},
	},
	emits: ['change-visibility', 'change-local-only', 'closed'],
	data() {
		return {
			v: this.currentVisibility,
			localOnly: this.currentLocalOnly,
		}
	},
	watch: {
		localOnly() {
			this.$emit('change-local-only', this.localOnly);
		}
	},
	methods: {
		choose(visibility) {
			this.v = visibility;
			this.$emit('change-visibility', visibility);
			this.$nextTick(() => {
				this.$refs.modal.close();
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.gqyayizv {
	width: 240px;
	padding: 8px 0;

	> .divider {
		margin: 8px 0;
		border-top: solid 0.5px var(--divider);
	}

	> button {
		display: flex;
		padding: 8px 14px;
		font-size: 12px;
		text-align: left;
		width: 100%;
		box-sizing: border-box;

		&:hover {
			background: rgba(0, 0, 0, 0.05);
		}

		&:active {
			background: rgba(0, 0, 0, 0.1);
		}

		&.active {
			color: #fff;
			background: var(--accent);
		}

		&.localOnly.active {
			color: var(--accent);
			background: inherit;
		}

		> *:nth-child(1) {
			display: flex;
			justify-content: center;
			align-items: center;
			margin-right: 10px;
			width: 16px;
			top: 0;
			bottom: 0;
			margin-top: auto;
			margin-bottom: auto;
		}

		> *:nth-child(2) {
			flex: 1 1 auto;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			> span:first-child {
				display: block;
				font-weight: bold;
			}

			> span:last-child:not(:first-child) {
				opacity: 0.6;
			}
		}

		> *:nth-child(3) {
			display: flex;
			justify-content: center;
			align-items: center;
			margin-left: 10px;
			width: 16px;
			top: 0;
			bottom: 0;
			margin-top: auto;
			margin-bottom: auto;
		}
	}
}
</style>
