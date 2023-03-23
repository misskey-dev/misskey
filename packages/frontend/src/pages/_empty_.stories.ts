/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import _empty_ from './_empty_.vue';
const meta = {
	title: 'pages/_empty_',
	component: _empty_,
} satisfies Meta<typeof _empty_>;
export const Default = {
	render(args) {
		return {
			components: {
				_empty_,
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
			template: '<_empty_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof _empty_>;
export default meta;
