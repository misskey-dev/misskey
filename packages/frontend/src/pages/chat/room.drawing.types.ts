/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * お絵描きチャットの型定義
 */

export type ToolType = 'pen' | 'eraser' | 'eyedropper';

export type GestureState = 'none' | 'pan' | 'zoom' | 'hybrid';

export type EventType = 'touchstart' | 'touchmove' | 'touchend' | 'mousedown' | 'mousemove' | 'mouseup';

export interface Point {
	x: number;
	y: number;
}

export interface PressurePoint extends Point {
	pressure: number;
}

export interface StrokeData {
	id: string;
	userId: string;
	userName: string;
	points: PressurePoint[];
	tool: ToolType;
	color: string;
	strokeWidth: number;
	opacity: number;
	layer: number;
	timestamp: number;
}

export interface ProgressData {
	userId: string;
	userName: string;
	points: PressurePoint[];
	tool: ToolType;
	color: string;
	strokeWidth: number;
	opacity: number;
	layer: number;
	timestamp: number;
}

export interface CursorData {
	userId: string;
	userName: string;
	x: number;
	y: number;
	timestamp: number;
}

export interface RemoteCursor {
	userId: string;
	userName: string;
	x: number;
	y: number;
	color: string;
}

export interface DrawingTraceLog {
	timestamp: number;
	type: EventType;
	screenX: number;
	screenY: number;
	canvasX: number;
	canvasY: number;
	tool: string;
	color: string;
	strokeWidth: number;
	zoomLevel: number;
	panOffset: Point;
}

export interface CommunicationLog {
	timestamp: number;
	direction: 'send' | 'receive';
	type: string;
	data: any;
}

export interface CanvasSize {
	name: string;
	width: number;
	height: number;
}

export interface CorrectionLevel {
	level: number;
	name: string;
	factor: number;
	minDistance: number;
	velocitySmoothing: number;
}

export interface DebugInfo {
	device: Record<string, any>;
	sizes: Record<string, any>;
	input: Record<string, any>;
	scales: Record<string, any>;
	transform: Record<string, any>;
	final: Record<string, any>;
	lastUpdate: string;
}

export interface RealtimeCoords {
	screen: string;
	canvas: string;
	isActive: boolean;
}

export interface HandShakeCorrection {
	enabled: { value: boolean };
	level: { value: number };
	pressureSimulation: { value: boolean };
	stabilization: { value: boolean };
}

export interface ToolStrokeWidths {
	pen: number;
	eraser: number;
}

export interface TimedPoint extends Point {
	time: number;
}
