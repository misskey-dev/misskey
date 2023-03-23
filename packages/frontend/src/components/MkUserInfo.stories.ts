/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUserInfo from './MkUserInfo.vue';
const meta = {
	title: 'components/MkUserInfo',
	component: MkUserInfo,
} satisfies Meta<typeof MkUserInfo>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUserInfo,
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
			template: '<MkUserInfo v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserInfo>;
export default meta;
