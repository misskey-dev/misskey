/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Telemetry-specific shutdown is implemented by telemetry-registry.ts.
 * Signal coordination belongs to boot/shutdown-handler.ts so telemetry and
 * logging remain independent domains.
 */
export { shutdownTelemetry } from './telemetry-registry.js';
