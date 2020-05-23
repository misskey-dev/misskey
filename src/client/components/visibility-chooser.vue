<template>
<x-popup :source="source" ref="popup" @closed="() => { $emit('closed'); destroyDom(); }">
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
		<button class="_button" @click="choose('specified')" :class="{ active: v == 'specified' }" data-index="4" key="specified">
			<div><fa :icon="faEnvelope"/></div>
			<div>
				<span>{{ $t('_visibility.specified') }}</span>
				<span>{{ $t('_visibility.specifiedDescription') }}</span>
			</div>
		</button>
	</div>
</x-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import { faGlobe, faUnlock, faHome } from '@fortawesome/free-solid-svg-icons';
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
		}
	},
	data() {
		return {
			v: this.$store.state.settings.rememberNoteVisibility ? this.$store.state.deviceUser.visibility : (this.currentVisibility || this.$store.state.settings.defaultNoteVisibility),
			faGlobe, faUnlock, faEnvelope, faHome
		}
	},
	methods: {
		choose(visibility) {
			if (this.$store.state.settings.rememberNoteVisibility) {
				this.$store.commit('deviceUser/setVisibility', visibility);
			}
			this.$emit('chosen', visibility);
			this.destroyDom();
		},
	}
});
</script>

<style lang="scss" scoped>
.gqyayizv {
	width: 240px;
	padding: 8px 0;

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

		> *:first-child {
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

		> *:last-child {
			flex: 1 1 auto;

			> span:first-child {
				display: block;
				font-weight: bold;
			}

			> span:last-child:not(:first-child) {
				opacity: 0.6;
			}
		}
	}
}
</style>
