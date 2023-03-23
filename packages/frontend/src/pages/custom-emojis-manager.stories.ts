/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import custom_emojis_manager from './custom-emojis-manager.vue';
const meta = {
	title: 'pages/custom-emojis-manager',
	component: custom_emojis_manager,
} satisfies Meta<typeof custom_emojis_manager>;
export const Default = {
	render(args) {
		return {
			components: {
				custom_emojis_manager,
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
			template: '<custom_emojis_manager v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof custom_emojis_manager>;
export default meta;
