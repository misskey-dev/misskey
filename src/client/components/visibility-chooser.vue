<template>
<x-popup :source="source" ref="popup" @closed="closed">
	<div class="gqyayizv">
		<button class="_button" @click="choose('public')" :class="{ active: v == 'public' }" data-index="1" key="public">
			<div><fa :icon="faGlobe"/></div>
			<div>
				<span>{{ $t('_visibility.public') }}</span>
				<span>{{ $t('_visibility.publicDescription') }}</span>
			</div>
		</button>
		<button class="_button" @click="choose('home')" :class="{ active: v == 'home' }" data-index="2" key="home">
			<div><fa :icon="faHome"/></div>
			<div>
				<span>{{ $t('_visibility.home') }}</span>
				<span>{{ $t('_visibility.homeDescription') }}</span>
			</div>
		</button>
		<button class="_button" @click="choose('followers')" :class="{ active: v == 'followers' }" data-index="3" key="followers">
			<div><fa :icon="faUnlock"/></div>
			<div>
				<span>{{ $t('_visibility.followers') }}</span>
				<span>{{ $t('_visibility.followersDescription') }}</span>
			</div>
		</button>
		<button :disabled="localOnly" class="_button" @click="choose('specified')" :class="{ active: v == 'specified' }" data-index="4" key="specified">
			<div><fa :icon="faEnvelope"/></div>
			<div>
				<span>{{ $t('_visibility.specified') }}</span>
				<span>{{ $t('_visibility.specifiedDescription') }}</span>
			</div>
		</button>
		<div class="divider"></div>
		<button class="_button localOnly" @click="localOnly = !localOnly" :class="{ active: localOnly }" data-index="5" key="localOnly">
			<div><fa :icon="faBiohazard"/></div>
			<div>
				<span>{{ $t('_visibility.localOnly') }}</span>
				<span>{{ $t('_visibility.localOnlyDescription') }}</span>
			</div>
			<div><fa :icon="localOnly ? faToggleOn : faToggleOff"/></div>
		</button>
	</div>
</x-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import { faGlobe, faUnlock, faHome, faBiohazard, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import XPopup from './popup.vue';

export default Vue.extend({
	components: {
		XPopup
	},
	props: {
		source: {
			required: true
		},
		currentVisibility: {
			type: String,
			required: false
		},
		currentLocalOnly: {
			type: Boolean,
			required: false
		}
	},
	data() {
		return {
			v: this.$store.state.settings.rememberNoteVisibility ? this.$store.state.deviceUser.visibility : (this.currentVisibility || this.$store.state.settings.defaultNoteVisibility),
			localOnly: this.currentLocalOnly,
			faGlobe, faUnlock, faEnvelope, faHome, faBiohazard, faToggleOn, faToggleOff
		}
	},
	methods: {
		choose(visibility) {
			if (this.$store.state.settings.rememberNoteVisibility) {
				this.$store.commit('deviceUser/setVisibility', visibility);
			}
			this.$emit('chosen', { visibility, localOnly: this.localOnly });
			this.destroyDom();
		},
		closed() {
			this.$emit('closed');
			// localOnly フラグの更新の為に chosen イベントも呼ぶ
			this.choose(this.v);
			this.destroyDom();
		}
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
