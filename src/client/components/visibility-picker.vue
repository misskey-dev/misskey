<template>
<MkModal ref="modal" :src="src" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div class="gqyayizv _popup">
		<button class="_button" @click="choose('public')" :class="{ active: v == 'public' }" data-index="1" key="public">
			<div><Fa :icon="faGlobe"/></div>
			<div>
				<span>{{ $ts._visibility.public }}</span>
				<span>{{ $ts._visibility.publicDescription }}</span>
			</div>
		</button>
		<button class="_button" @click="choose('home')" :class="{ active: v == 'home' }" data-index="2" key="home">
			<div><Fa :icon="faHome"/></div>
			<div>
				<span>{{ $ts._visibility.home }}</span>
				<span>{{ $ts._visibility.homeDescription }}</span>
			</div>
		</button>
		<button class="_button" @click="choose('followers')" :class="{ active: v == 'followers' }" data-index="3" key="followers">
			<div><Fa :icon="faUnlock"/></div>
			<div>
				<span>{{ $ts._visibility.followers }}</span>
				<span>{{ $ts._visibility.followersDescription }}</span>
			</div>
		</button>
		<button :disabled="localOnly" class="_button" @click="choose('specified')" :class="{ active: v == 'specified' }" data-index="4" key="specified">
			<div><Fa :icon="faEnvelope"/></div>
			<div>
				<span>{{ $ts._visibility.specified }}</span>
				<span>{{ $ts._visibility.specifiedDescription }}</span>
			</div>
		</button>
		<div class="divider"></div>
		<button class="_button localOnly" @click="localOnly = !localOnly" :class="{ active: localOnly }" data-index="5" key="localOnly">
			<div><Fa :icon="faBiohazard"/></div>
			<div>
				<span>{{ $ts._visibility.localOnly }}</span>
				<span>{{ $ts._visibility.localOnlyDescription }}</span>
			</div>
			<div><Fa :icon="localOnly ? faToggleOn : faToggleOff" :key="localOnly"/></div>
		</button>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faGlobe, faUnlock, faHome, faBiohazard, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
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
			faGlobe, faUnlock, faEnvelope, faHome, faBiohazard, faToggleOn, faToggleOff
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
		border-top: solid 1px var(--divider);
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
