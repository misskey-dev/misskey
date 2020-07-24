<template>
<div class="_card tbkwesmv">
	<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('_tutorial.title') }}</div>
	<div class="_content" v-if="tutorial === 0">
		<div>{{ $t('_tutorial.step1_1') }}</div>
		<div>{{ $t('_tutorial.step1_2') }}</div>
		<div>{{ $t('_tutorial.step1_3') }}</div>
	</div>
	<div class="_content" v-else-if="tutorial === 1">
		<div>{{ $t('_tutorial.step2_1') }}</div>
		<div>{{ $t('_tutorial.step2_2') }}</div>
		<router-link class="_link" to="/my/settings">{{ $t('editProfile') }}</router-link>
	</div>
	<div class="_content" v-else-if="tutorial === 2">
		<div>{{ $t('_tutorial.step3_1') }}</div>
		<div>{{ $t('_tutorial.step3_2') }}</div>
		<div>{{ $t('_tutorial.step3_3') }}</div>
		<small>{{ $t('_tutorial.step3_4') }}</small>
	</div>
	<div class="_content" v-else-if="tutorial === 3">
		<div>{{ $t('_tutorial.step4_1') }}</div>
		<div>{{ $t('_tutorial.step4_2') }}</div>
	</div>
	<div class="_content" v-else-if="tutorial === 4">
		<div>{{ $t('_tutorial.step5_1') }}</div>
		<i18n-t path="_tutorial.step5_2" tag="div">
			<router-link class="_link" place="featured" to="/featured">{{ $t('featured') }}</router-link>
			<router-link class="_link" place="explore" to="/explore">{{ $t('explore') }}</router-link>
		</i18n-t>
		<div>{{ $t('_tutorial.step5_3') }}</div>
		<small>{{ $t('_tutorial.step5_4') }}</small>
	</div>
	<div class="_content" v-else-if="tutorial === 5">
		<div>{{ $t('_tutorial.step6_1') }}</div>
		<div>{{ $t('_tutorial.step6_2') }}</div>
		<div>{{ $t('_tutorial.step6_3') }}</div>
	</div>
	<div class="_content" v-else-if="tutorial === 6">
		<div>{{ $t('_tutorial.step7_1') }}</div>
		<i18n-t path="_tutorial.step7_2" tag="div">
			<router-link class="_link" place="help" to="/docs">{{ $t('help') }}</router-link>
		</i18n-t>
		<div>{{ $t('_tutorial.step7_3') }}</div>
	</div>

	<div class="_footer navigation">
		<div class="step">
			<button class="arrow _button" @click="tutorial--" :disabled="tutorial === 0">
				<fa :icon="faChevronLeft"/>
			</button>
			<span>{{ tutorial + 1 }} / 7</span>
			<button class="arrow _button" @click="tutorial++" :disabled="tutorial === 6">
				<fa :icon="faChevronRight"/>
			</button>
		</div>
		<mk-button class="ok" @click="tutorial = -1" primary v-if="tutorial === 6"><fa :icon="faCheck"/> {{ $t('gotIt') }}</mk-button>
		<mk-button class="ok" @click="tutorial++" primary v-else><fa :icon="faCheck"/> {{ $t('next') }}</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle, faChevronLeft, faChevronRight, faCheck } from '@fortawesome/free-solid-svg-icons'
import MkButton from '../components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton,
	},

	data() {
		return {
			faInfoCircle, faChevronLeft, faChevronRight, faCheck
		}
	},

	computed: {
		tutorial: {
			get() { return this.$store.state.settings.tutorial || 0; },
			set(value) { this.$store.dispatch('settings/set', { key: 'tutorial', value }); }
		},
	},
});
</script>

<style lang="scss" scoped>
.tbkwesmv {
	> ._content {
		> small {
			opacity: 0.7;
		}
	}

	> .navigation {
		display: flex;
		flex-direction: row;
		align-items: baseline;

		> .step {
			> .arrow {
				padding: 4px;

				&:disabled {
					opacity: 0.5;
				}

				&:first-child {
					padding-right: 8px;
				}

				&:last-child {
					padding-left: 8px;
				}
			}

			> span {
				margin: 0 4px;
			}
		}

		> .ok {
			margin-left: auto;
		}
	}
}
</style>
