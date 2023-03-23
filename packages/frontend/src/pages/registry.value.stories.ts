/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import registry_value from './registry.value.vue';
const meta = {
	title: 'pages/registry.value',
	component: registry_value,
} satisfies Meta<typeof registry_value>;
export const Default = {
	render(args) {
		return {
			components: {
				registry_value,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<registry_value v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof registry_value>;
export default meta;
