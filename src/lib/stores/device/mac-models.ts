export type MacDeviceType = 'macbook' | 'desktop' | 'unknown';

export const MAC_MODEL_MAP: Record<string, { type: MacDeviceType; chip: string }> = {
	// iMac
	'iMac21,1': { chip: 'M1', type: 'desktop' },
	'iMac21,2': { chip: 'M1', type: 'desktop' },
	'iMac22,1': { chip: 'M3', type: 'desktop' },
	'iMac22,2': { chip: 'M3', type: 'desktop' },
	'iMac23,1': { chip: 'M4', type: 'desktop' },
	'iMac23,2': { chip: 'M4', type: 'desktop' },
	// MacBook
	'MacBook10,1': { chip: 'M3', type: 'macbook' },
	'MacBook11,1': { chip: 'M4', type: 'macbook' },
	// MacBook Air
	'MacBookAir10,1': { chip: 'M2', type: 'macbook' },
	'MacBookAir11,1': { chip: 'M3', type: 'macbook' },
	'MacBookAir12,1': { chip: 'M4', type: 'macbook' },
	// MacBook Pro
	'MacBookPro16,1': { chip: 'M1 Pro', type: 'macbook' },
	'MacBookPro16,2': { chip: 'M1 Pro', type: 'macbook' },
	'MacBookPro17,1': { chip: 'M1 Max', type: 'macbook' },
	'MacBookPro18,1': { chip: 'M1 Max', type: 'macbook' },
	'MacBookPro18,2': { chip: 'M1 Pro', type: 'macbook' },
	'MacBookPro18,3': { chip: 'M1 Max', type: 'macbook' },
	'MacBookPro18,4': { chip: 'M1 Ultra', type: 'macbook' },
	'MacBookPro19,1': { chip: 'M2 Pro', type: 'macbook' },

	'MacBookPro19,2': { chip: 'M2 Max', type: 'macbook' },
	'MacBookPro19,3': { chip: 'M2 Max', type: 'macbook' },
	'MacBookPro19,4': { chip: 'M2 Pro', type: 'macbook' },

	'MacBookPro20,1': { chip: 'M3 Pro', type: 'macbook' },
	'MacBookPro20,2': { chip: 'M3 Max', type: 'macbook' },

	'MacBookPro20,3': { chip: 'M3 Max', type: 'macbook' },
	'MacBookPro20,4': { chip: 'M3 Pro', type: 'macbook' },
	'MacBookPro21,1': { chip: 'M4 Pro', type: 'macbook' },
	'MacBookPro21,2': { chip: 'M4 Max', type: 'macbook' },
	'MacBookPro21,3': { chip: 'M4 Max', type: 'macbook' },
	'MacBookPro21,4': { chip: 'M4 Pro', type: 'macbook' },

	// Mac Mini
	'MacMini9,1': { chip: 'M1', type: 'desktop' },
	'MacMini10,1': { chip: 'M2', type: 'desktop' },
	'MacMini10,2': { chip: 'M2', type: 'desktop' },
	'MacMini11,1': { chip: 'M3', type: 'desktop' },
	'MacMini11,2': { chip: 'M4', type: 'desktop' },
	'MacMini11,3': { chip: 'M4', type: 'desktop' },

	// Mac Pro
	'MacPro7,1': { chip: 'Intel', type: 'desktop' },
	// Mac Studio
	'MacStudio1,1': { chip: 'M1 Max', type: 'desktop' },
	'MacStudio1,2': { chip: 'M1 Ultra', type: 'desktop' },
	'MacStudio2,1': { chip: 'M2 Max', type: 'desktop' },
	'MacStudio2,2': { chip: 'M2 Ultra', type: 'desktop' },
	'MacStudio3,1': { chip: 'M3 Max', type: 'desktop' },
	'MacStudio3,2': { chip: 'M3 Ultra', type: 'desktop' },
	'MacStudio4,1': { chip: 'M4 Max', type: 'desktop' },

	'MacStudio4,2': { chip: 'M4 Ultra', type: 'desktop' }
};

export function parseMacModelFromRenderer(
	renderer: string
): { type: MacDeviceType; chip: string } | null {
	if (renderer.toLowerCase().includes('or similar')) {
		return null;
	}

	if (/^Apple\s*GPU$/i.test(renderer)) {
		return null;
	}

	const m = renderer.match(/Apple\s+(M\d+(?:\s+(?:Max|Ultra|Pro))?)/i);

	if (!m) {
		return null;
	}

	const chip = m[1].trim();
	const isMaxOrUltra = chip.includes('Max') || chip.includes('Ultra');

	return { chip: `Apple ${chip}`, type: isMaxOrUltra ? 'desktop' : 'macbook' };
}

export function getMacModelFromHeuristics(
	deviceMemory: number | undefined,
	hardwareConcurrency: number | undefined
): MacDeviceType | null {
	if (!deviceMemory || !hardwareConcurrency) {
		return null;
	}

	if (hardwareConcurrency >= 24 && deviceMemory >= 100) {
		return 'desktop';
	}

	if (hardwareConcurrency >= 32 && deviceMemory >= 150) {
		return 'desktop';
	}

	if (hardwareConcurrency <= 16 && deviceMemory >= 8) {
		return 'macbook';
	}

	if (hardwareConcurrency <= 10 && deviceMemory >= 4) {
		return 'macbook';
	}

	return null;
}
