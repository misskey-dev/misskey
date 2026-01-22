/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { Component, ComputedRef, Ref, MaybeRef } from 'vue';
import type { ComponentProps as CP } from 'vue-component-type-helpers';
import type { OptionValue } from '@/types/option-value.js';

type ComponentProps<T extends Component> = { [K in keyof CP<T>]: MaybeRef<CP<T>[K]> };

type MenuRadioOptionsDef = Record<string, OptionValue>;

type Text = string | ComputedRef<string>;

export type MenuAction = (ev: PointerEvent) => void;

export interface MenuButton {
	type?: 'button';
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	icon?: string;
	indicate?: boolean;
	danger?: boolean;
	active?: boolean | ComputedRef<boolean>;
	avatar?: Misskey.entities.User;
	action: MenuAction;
}

interface MenuBase {
	type: string;
}

export interface MenuDivider extends MenuBase {
	type: 'divider';
}

export interface MenuLabel extends MenuBase {
	type: 'label';
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
}

export interface MenuLink extends MenuBase {
	type: 'link';
	to: string;
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	icon?: string;
	indicate?: boolean;
	avatar?: Misskey.entities.User;
}

export interface MenuA extends MenuBase {
	type: 'a';
	href: string;
	target?: string;
	download?: string;
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	icon?: string;
	indicate?: boolean;
}

export interface MenuUser extends MenuBase {
	type: 'user';
	user: Misskey.entities.User;
	active?: boolean;
	indicate?: boolean;
	action: MenuAction;
}

export interface MenuSwitch extends MenuBase {
	type: 'switch';
	ref: Ref<boolean>;
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	icon?: string;
	disabled?: boolean | Ref<boolean>;
}

export interface MenuRadio extends MenuBase {
	type: 'radio';
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	icon?: string;
	ref: Ref<MenuRadioOptionsDef[keyof MenuRadioOptionsDef]>;
	options: MenuRadioOptionsDef;
	disabled?: boolean | Ref<boolean>;
}

export interface MenuRadioOption extends MenuBase {
	type: 'radioOption';
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	action: MenuAction;
	active?: boolean | ComputedRef<boolean>;
}

export interface MenuComponent<T extends Component = any> extends MenuBase {
	type: 'component';
	component: T;
	props?: ComponentProps<T>;
}

export interface MenuParent extends MenuBase {
	type: 'parent';
	text: Text;
	caption?: Text | null | undefined | ComputedRef<null | undefined>;
	icon?: string;
	children: MenuItem[] | (() => Promise<MenuItem[]> | MenuItem[]);
}

export interface MenuPending extends MenuBase {
	type: 'pending';
}

type OuterMenuItem = MenuDivider | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuRadio | MenuRadioOption | MenuComponent | MenuParent;
type OuterPromiseMenuItem = Promise<MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuComponent | MenuParent>;
export type MenuItem = OuterMenuItem | OuterPromiseMenuItem;
export type InnerMenuItem = MenuDivider | MenuPending | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuRadio | MenuRadioOption | MenuComponent | MenuParent;
