<template>
<div :class="$style.container">
	<div :class="$style.title">
		<div :class="$style.titleText"><i class="ti ti-info-circle"></i> {{ i18n.ts._tutorial.title }}</div>
		<div :class="$style.step">
			<button class="_button" :class="$style.stepArrow" :disabled="tutorial === 0" @click="tutorial--">
				<i class="ti ti-chevron-left"></i>
			</button>
			<span :class="$style.stepNumber">{{ tutorial + 1 }} / {{ tutorialsNumber }}</span>
			<button class="_button" :class="$style.stepArrow" :disabled="tutorial === tutorialsNumber - 1" @click="tutorial++">
				<i class="ti ti-chevron-right"></i>
			</button>
		</div>
	</div>
	<div v-if="tutorial === 0" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step1_1 }}</div>
		<div>{{ i18n.ts._tutorial.step1_2 }}</div>
		<div>{{ i18n.ts._tutorial.step1_3 }}</div>
	</div>
	<div v-else-if="tutorial === 1" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step2_1 }}</div>
		<div>{{ i18n.ts._tutorial.step2_2 }}</div>
		<MkA class="_link" to="/settings/profile">{{ i18n.ts.editProfile }}</MkA>
	</div>
	<div v-else-if="tutorial === 2" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step3_1 }}</div>
		<div>{{ i18n.ts._tutorial.step3_2 }}</div>
		<div>{{ i18n.ts._tutorial.step3_3 }}</div>
		<small :class="$style.small">{{ i18n.ts._tutorial.step3_4 }}</small>
	</div>
	<div v-else-if="tutorial === 3" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step4_1 }}</div>
		<div>{{ i18n.ts._tutorial.step4_2 }}</div>
	</div>
	<div v-else-if="tutorial === 4" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step5_1 }}</div>
		<I18n :src="i18n.ts._tutorial.step5_2" tag="div">
			<template #featured>
				<MkA class="_link" to="/explore">{{ i18n.ts.featured }}</MkA>
			</template>
			<template #explore>
				<MkA class="_link" to="/explore#users">{{ i18n.ts.explore }}</MkA>
			</template>
		</I18n>
		<div>{{ i18n.ts._tutorial.step5_3 }}</div>
		<small :class="$style.small">{{ i18n.ts._tutorial.step5_4 }}</small>
	</div>
	<div v-else-if="tutorial === 5" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step6_1 }}</div>
		<div>{{ i18n.ts._tutorial.step6_2 }}</div>
		<div>{{ i18n.ts._tutorial.step6_3 }}</div>
	</div>
	<div v-else-if="tutorial === 6" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step7_1 }}</div>
		<I18n :src="i18n.ts._tutorial.step7_2" tag="div">
			<template #help>
				<a href="https://misskey-hub.net/help.html" target="_blank" class="_link">{{ i18n.ts.help }}</a>
			</template>
		</I18n>
		<div>{{ i18n.ts._tutorial.step7_3 }}</div>
	</div>
	<div v-else-if="tutorial === 7" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step8_1 }}</div>
		<div>{{ i18n.ts._tutorial.step8_2 }}</div>
		<small :class="$style.small">{{ i18n.ts._tutorial.step8_3 }}</small>
	</div>

	<div :class="$style.footer">
		<template v-if="tutorial === tutorialsNumber - 1">
			<MkPushNotificationAllowButton :class="$style.footerItem" primary show-only-to-register @click="tutorial = -1"/>
			<MkButton :class="$style.footerItem" :primary="false" @click="tutorial = -1">{{ i18n.ts.noThankYou }}</MkButton>
		</template>
		<template v-else>
			<MkButton :class="$style.footerItem" primary @click="tutorial++"><i class="ti ti-check"></i> {{ i18n.ts.next }}</MkButton>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

const tutorialsNumber = 8;

const tutorial = computed({
	get() { return defaultStore.reactiveState.tutorial.value || 0; },
	set(value) { defaultStore.set('tutorial', value); },
});
</script>

<style lang="scss" module>
.small {
	opacity: 0.7;
}

.container {
	border: solid 2px var(--accent);
}

.title {
	display: flex;
	flex-wrap: wrap;
	padding: 22px 32px;
	font-weight: bold;

	&Text {
		margin: 4px 0;
		padding-right: 4px;
	}
}

.step {
	margin-left: auto;

	&Arrow {
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

	&Number {
		font-weight: normal;
		margin: 4px;
	}
}

.body {
	padding: 0 32px;
}

.footer {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: right;
	padding: 22px 32px;

	&Item {
		margin: 4px;
	}
}
</style>
