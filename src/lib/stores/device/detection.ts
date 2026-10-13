import type { DeviceFormFactor } from './index.svelte';

export function getAppleSiliconRenderer(): string | null {
	try {
		const canvas = document.createElement('canvas');
		const gl =
			(canvas.getContext('webgl') as WebGLRenderingContext) ||
			(canvas.getContext('experimental-webgl') as WebGLRenderingContext);

		if (!gl) {
			return null;
		}

		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

		if (!debugInfo) {
			return null;
		}

		return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	} catch (e) {
		throw e instanceof Error ? e : new Error(String(e));
	}
}

export function getChromeDeviceModel(): Promise<string | null> {
	const nav = navigator as Navigator & {
		userAgentData?: {
			getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
			platform: string;
		};
	};

	if (!nav.userAgentData?.getHighEntropyValues) {
		return Promise.resolve(null);
	}

	return nav.userAgentData
		.getHighEntropyValues([
			'model',
			'platform',
			'platformVersion',
			'architecture',
			'bitness',
			'fullVersionList'
		])
		.then((values: Record<string, unknown>) => {
			return (values.model as string | undefined) || null;
		})
		.catch((e) => {
			throw e instanceof Error ? e : new Error(String(e));
		});
}

export function detectBrowser(): string {
	const ua = navigator.userAgent;

	if (ua.includes('Firefox/')) {
		return 'Firefox';
	}

	if (ua.includes('Edg/')) {
		return 'Edge';
	}

	if (ua.includes('OPR/') || ua.includes('Opera')) {
		return 'Opera';
	}

	if (ua.includes('Chrome/')) {
		return 'Chrome';
	}

	if (ua.includes('Safari/')) {
		return 'Safari';
	}

	return 'Unknown';
}

export function detectFormFactor(): DeviceFormFactor {
	const width = window.innerWidth;

	if (width < 768) {
		return 'mobile';
	}

	if (width < 1024) {
		return 'tablet';
	}

	return 'desktop';
}
