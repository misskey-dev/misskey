/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import create_ from './create.vue';
const meta = {
	title: 'pages/my-antennas/create',
	component: create_,
} satisfies Meta<typeof create_>;
export const Default = {
	render(args) {
		return {
			components: {
				create_,
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
			template: '<create_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof create_>;
export default meta;
