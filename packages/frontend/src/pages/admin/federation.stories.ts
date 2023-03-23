/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import federation_ from './federation.vue';
const meta = {
	title: 'pages/admin/federation',
	component: federation_,
} satisfies Meta<typeof federation_>;
export const Default = {
	render(args) {
		return {
			components: {
				federation_,
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
			template: '<federation_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof federation_>;
export default meta;
