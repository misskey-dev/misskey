<template>
<MkContainer :style="`height: ${props.height}px;`" :show-header="props.showHeader" :scrollable="true">
	<template #header><i class="fas fa-bell"></i>{{ $ts.notifications }}</template>
	<template #func><button class="_button" @click="configure()"><i class="fas fa-cog"></i></button></template>

	<div>
		<XNotifications :include-types="props.includingTypes"/>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@/components/ui/container.vue';
import XNotifications from '@/components/notifications.vue';
import define from './define';
import * as os from '@/os';

const widget = define({
	name: 'notifications',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		height: {
			type: 'number',
			default: 300,
		},
		includingTypes: {
			type: 'array',
			hidden: true,
			default: null,
		},
	})
});

export default defineComponent({

	components: {
		MkContainer,
		XNotifications,
	},
	extends: widget,

	data() {
		return {
		};
	},

	methods: {
		configure() {
			os.popup(import('@/components/notification-setting-window.vue'), {
				includingTypes: this.props.includingTypes,
			}, {
				done: async (res) => {
					const { includingTypes } = res;
					this.props.includingTypes = includingTypes;
					this.save();
				}
			}, 'closed');
		}
	}
});
</script>
