<template>
<div class="_card tbkwesmv">
	<div class="_title"><i class="fas fa-info-circle"></i> {{ $ts._tutorial.title }}</div>
	<div class="_content" v-if="tutorial === 0">
		<div>{{ $ts._tutorial.step1_1 }}</div>
		<div>{{ $ts._tutorial.step1_2 }}</div>
		<div>{{ $ts._tutorial.step1_3 }}</div>
	</div>
	<div class="_content" v-else-if="tutorial === 1">
		<div>{{ $ts._tutorial.step2_1 }}</div>
		<div>{{ $ts._tutorial.step2_2 }}</div>
		<MkA class="_link" to="/settings/profile">{{ $ts.editProfile }}</MkA>
	</div>
	<div class="_content" v-else-if="tutorial === 2">
		<div>{{ $ts._tutorial.step3_1 }}</div>
		<div>{{ $ts._tutorial.step3_2 }}</div>
		<div>{{ $ts._tutorial.step3_3 }}</div>
		<small>{{ $ts._tutorial.step3_4 }}</small>
	</div>
	<div class="_content" v-else-if="tutorial === 3">
		<div>{{ $ts._tutorial.step4_1 }}</div>
		<div>{{ $ts._tutorial.step4_2 }}</div>
	</div>
	<div class="_content" v-else-if="tutorial === 4">
		<div>{{ $ts._tutorial.step5_1 }}</div>
		<I18n :src="$ts._tutorial.step5_2" tag="div">
			<template #featured>
				<MkA class="_link" to="/featured">{{ $ts.featured }}</MkA>
			</template>
			<template #explore>
				<MkA class="_link" to="/explore">{{ $ts.explore }}</MkA>
			</template>
		</I18n>
		<div>{{ $ts._tutorial.step5_3 }}</div>
		<small>{{ $ts._tutorial.step5_4 }}</small>
	</div>
	<div class="_content" v-else-if="tutorial === 5">
		<div>{{ $ts._tutorial.step6_1 }}</div>
		<div>{{ $ts._tutorial.step6_2 }}</div>
		<div>{{ $ts._tutorial.step6_3 }}</div>
	</div>
	<div class="_content" v-else-if="tutorial === 6">
		<div>{{ $ts._tutorial.step7_1 }}</div>
		<I18n :src="$ts._tutorial.step7_2" tag="div">
			<template #help>
				<a href="https://misskey-hub.net/help.html" target="_blank" class="_link">{{ $ts.help }}</a>
			</template>
		</I18n>
		<div>{{ $ts._tutorial.step7_3 }}</div>
	</div>

	<div class="_footer navigation">
		<div class="step">
			<button class="arrow _button" @click="tutorial--" :disabled="tutorial === 0">
				<i class="fas fa-chevron-left"></i>
			</button>
			<span>{{ tutorial + 1 }} / 7</span>
			<button class="arrow _button" @click="tutorial++" :disabled="tutorial === 6">
				<i class="fas fa-chevron-right"></i>
			</button>
		</div>
		<MkButton class="ok" @click="tutorial = -1" primary v-if="tutorial === 6"><i class="fas fa-check"></i> {{ $ts.gotIt }}</MkButton>
		<MkButton class="ok" @click="tutorial++" primary v-else><i class="fas fa-check"></i> {{ $ts.next }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton,
	},

	data() {
		return {
		}
	},

	computed: {
		tutorial: {
			get() { return this.$store.reactiveState.tutorial.value || 0; },
			set(value) { this.$store.set('tutorial', value); }
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
