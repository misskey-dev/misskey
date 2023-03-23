/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSignin from './MkSignin.vue';
const meta = {
	title: 'components/MkSignin',
	component: MkSignin,
} satisfies Meta<typeof MkSignin>;
export const Default = {
	render(args) {
		return {
			components: {
				MkSignin,
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
			template: '<MkSignin v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSignin>;
export default meta;
