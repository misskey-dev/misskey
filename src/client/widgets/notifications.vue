<template>
<div class="mkw-notifications" :style="`flex-basis: calc(${basis}% - var(--margin)); height: ${previewHeight}px;`">
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

const basisSteps = [25, 50, 75, 100]
const previewHeights = [200, 300, 400, 500]

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
		basis(): number {
			return basisSteps[this.props.basisStep] || 25
		},

		previewHeight(): number {
			return previewHeights[this.props.basisStep] || 200
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
		background: var(--bg);
		padding: 8px;
	}
}
</style>
