/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { RoleService } from '@/core/RoleService.js';
import type { MiUser } from '@/models/_.js';

export type NoctownPermission =
	| 'noctown:admin:items' // Create/edit/delete items
	| 'noctown:admin:distribute' // Distribute items to players
	| 'noctown:admin:world' // Edit world settings
	| 'noctown:admin:recipes' // Manage recipes
	| 'noctown:mod:ban' // Ban players from Noctown
	| 'noctown:mod:warn' // Warn players
	| 'noctown:mod:logs' // View moderation logs
	| 'noctown:player:trade' // Trade with other players
	| 'noctown:player:chat' // Send chat messages
	| 'noctown:player:place'; // Place items in world

@Injectable()
export class NoctownPermissionService {
	constructor(
		private roleService: RoleService,
	) {}

	/**
	 * Check if user has a specific Noctown permission
	 */
	public async hasPermission(user: MiUser, permission: NoctownPermission): Promise<boolean> {
		// Administrators have all permissions
		if (await this.roleService.isAdministrator(user)) {
			return true;
		}

		// Check permission-specific rules
		switch (permission) {
			case 'noctown:admin:items':
			case 'noctown:admin:recipes':
				// Moderators can manage items and recipes
				return await this.roleService.isModerator(user);

			case 'noctown:admin:distribute':
			case 'noctown:admin:world':
				// Only admins can distribute items and edit world
				return false;

			case 'noctown:mod:ban':
			case 'noctown:mod:warn':
			case 'noctown:mod:logs':
				// Moderators can use moderation tools
				return await this.roleService.isModerator(user);

			case 'noctown:player:trade':
			case 'noctown:player:chat':
			case 'noctown:player:place':
				// All players can do these (unless specifically restricted)
				return true;

			default:
				return false;
		}
	}

	/**
	 * Check if user is a Noctown admin (full control)
	 */
	public async isNoctownAdmin(user: MiUser): Promise<boolean> {
		return await this.roleService.isAdministrator(user);
	}

	/**
	 * Check if user is a Noctown moderator
	 */
	public async isNoctownModerator(user: MiUser): Promise<boolean> {
		return await this.roleService.isModerator(user);
	}

	/**
	 * Get all permissions for a user
	 */
	public async getPermissions(user: MiUser): Promise<NoctownPermission[]> {
		const permissions: NoctownPermission[] = [];

		const isAdmin = await this.roleService.isAdministrator(user);
		const isMod = await this.roleService.isModerator(user);

		// Player permissions (everyone)
		permissions.push('noctown:player:trade');
		permissions.push('noctown:player:chat');
		permissions.push('noctown:player:place');

		// Moderator permissions
		if (isMod) {
			permissions.push('noctown:admin:items');
			permissions.push('noctown:admin:recipes');
			permissions.push('noctown:mod:ban');
			permissions.push('noctown:mod:warn');
			permissions.push('noctown:mod:logs');
		}

		// Admin permissions
		if (isAdmin) {
			permissions.push('noctown:admin:distribute');
			permissions.push('noctown:admin:world');
		}

		return permissions;
	}

	/**
	 * Check multiple permissions at once
	 */
	public async hasAnyPermission(user: MiUser, permissions: NoctownPermission[]): Promise<boolean> {
		for (const permission of permissions) {
			if (await this.hasPermission(user, permission)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if user has all specified permissions
	 */
	public async hasAllPermissions(user: MiUser, permissions: NoctownPermission[]): Promise<boolean> {
		for (const permission of permissions) {
			if (!(await this.hasPermission(user, permission))) {
				return false;
			}
		}
		return true;
	}
}
