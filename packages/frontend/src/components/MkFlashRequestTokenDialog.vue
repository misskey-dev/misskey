<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	@close="dialog!.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.additionalPermissionsForFlash }}</template>
	<MkSpacer :marginMin="20" :marginMax="28">
		<p>{{ i18n.ts.thisFlashRequiresTheFollowingPermissions }}</p>
		<ul>
			<li v-for="permission in props.permissions" :key="permission">
				{{ i18n.t(`_permissions.${permission}`) }}
			</li>
		</ul>
		<p>{{ i18n.ts.doYouWantToAllowThisPlayToAccessYourAccount }}</p>
		<div>
			<MkButton inline :class="$style.cancel" @click="cancel">{{ i18n.ts.cancel }}</MkButton>
			<MkButton primary inline @click="accept">{{ i18n.ts.accept }}</MkButton>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import MkModalWindow from './MkModalWindow.vue';
import MkSpacer from './global/MkSpacer.vue';
import MkButton from './MkButton.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	permissions: string[];
}>();

const emit = defineEmits<{
	(ev: 'closed'): void,
	(ev: 'accept'): void,
	(ev: 'cancel'): void,
}>();

const dialog = ref<InstanceType<typeof MkModalWindow>>();

const cancel = () => {
	emit('cancel');
	dialog.value?.close();
};

const accept = () => {
	emit('accept');
	dialog.value?.close();
};
</script>
<style lang="scss" module>
.cancel {
	margin-right: 5px;
}
</style>
