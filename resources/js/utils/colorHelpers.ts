// Color helpers: convert between HEX <-> RGB <-> HSL and compute analogous colors
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
	const clean = hex.replace("#", "");
	const full =
		clean.length === 3
			? clean
					.split("")
					.map((c) => c + c)
					.join("")
			: clean;
	const int = parseInt(full, 16);
	return {
		r: (int >> 16) & 255,
		g: (int >> 8) & 255,
		b: int & 255,
	};
};

export const rgbToHsl = (
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } => {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h = h * 60;
	}
	return { h, s: s * 100, l: l * 100 };
};

export const hslToRgb = (
	h: number,
	s: number,
	l: number,
): { r: number; g: number; b: number } => {
	h = ((h % 360) + 360) % 360;
	s /= 100;
	l /= 100;
	if (s === 0) {
		const v = Math.round(l * 255);
		return { r: v, g: v, b: v };
	}
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const hue2rgb = (pVal: number, qVal: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return pVal + (qVal - pVal) * 6 * t;
		if (t < 1 / 2) return qVal;
		if (t < 2 / 3) return pVal + (qVal - pVal) * (2 / 3 - t) * 6;
		return pVal;
	};
	const hk = h / 360;
	const r = Math.round(hue2rgb(p, q, hk + 1 / 3) * 255);
	const g = Math.round(hue2rgb(p, q, hk) * 255);
	const b = Math.round(hue2rgb(p, q, hk - 1 / 3) * 255);
	return { r, g, b };
};

export const rgbToHex = (rgb: { r: number; g: number; b: number }) => {
	const toHex = (n: number) => n.toString(16).padStart(2, "0");
	return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

export const getAnalogousColors = (
	hex: string,
	angle = 30,
): [string, string, string] => {
	try {
		const rgb = hexToRgb(hex || "#b20f11");
		const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
		const h1 = (hsl.h + angle) % 360;
		const h3 = (hsl.h - angle + 360) % 360;
		const rgb1 = hslToRgb(h1, hsl.s, hsl.l);
		const rgb3 = hslToRgb(h3, hsl.s, hsl.l);
		return [rgbToHex(rgb1), hex, rgbToHex(rgb3)];
	} catch (e) {
		return ["#e67375", hex || "#b20f11", "#2e1e1e"];
	}
};
