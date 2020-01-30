<template>
<div class="mkw-notifications" :style="heightStyle">
	<mk-container :show-header="!props.compact" class="container">
		<template #header><fa :icon="faBell"/>{{ $t('notifications') }}</template>

		<div class="tl">
			<x-notifications/>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import { faBell } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import XNotifications from '../components/notifications.vue';
import define from './define';
import i18n from '../i18n';
import { heightStyle } from './flex';

export default define({
	name: 'notifications',
	props: () => ({
		compact: false,
		basisStep: 0
	})
}).extend({
	i18n,
	
	components: {
		MkContainer,
		XNotifications,
	},

	data() {
		return {
			faBell
		};
	},

	computed: {
		heightStyle(): string {
			return heightStyle(this.props.basisStep)
		}
	},

	methods: {
		func() {
			if (this.props.basisStep === basisSteps.length - 1) {
				this.props.basisStep = 0
				this.props.compact = !this.props.compact;
			} else {
				this.props.basisStep += 1
			}

			this.save();
		}
	}
});
</script>

<style lang="scss">
.mkw-notifications {
	flex-grow: 1;
	flex-shrink: 0;
	min-height: 0; // https://www.gwtcenter.com/min-height-required-on-firefox-flexbox

	.container {
		display: flex;
		flex-direction: column;
		height: 100%;

		> div {
			overflow: auto;
			flex-grow: 1;
		}
	}

	.tl {
		height: 100%;
		background: var(--bg);
		// box-sizing: border-box;
	}
}
</style>
