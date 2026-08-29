import { Head, usePage } from "@inertiajs/react";
import { TrendingUpIcon } from "lucide-react";
import React, { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Grainient from "@/components/backgrounds/grainient";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useBrand } from "@/contexts/BrandContext";
import { THEME_COLORS, useAppearance } from "@/hooks/use-appearance";
import { useFavicon } from "@/hooks/use-favicon";
import { getAnalogousColors} from "@/utils/colorHelpers";

interface AuthLayoutProps {
	children: ReactNode;
	title: string;
	description?: string;
	icon?: ReactNode;
	status?: string;
	statusType?: "success" | "error";
}

export default function AuthLayout({
	children,
	title,
	description,
	icon,
	status,
	statusType = "success",
}: AuthLayoutProps) {
	useFavicon();
	const { t } = useTranslation();
	const [mounted, setMounted] = useState(false);
	const { logoLight, logoDark, themeColor, customColor } = useBrand();
	const { appearance } = useAppearance();
	const globalSettings = (usePage().props as any).globalSettings;
	const userLanguage = (usePage().props as any).userLanguage;

	const currentLogo = appearance === "dark" ? logoLight : logoDark;
	const primaryColor =
		themeColor === "custom"
			? customColor
			: THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

	// Compute analogous colors based on primaryColor (fallback provided)
	const _primaryHex = primaryColor || "#b20f11";
	const [analogColor1, analogColor2, analogColor3] =
		getAnalogousColors(_primaryHex);

	useEffect(() => {
		setMounted(true);
	}, []);

	const currentYear = new Date().getFullYear();
	const appName = "Unitec-SS";

	// RTL Support for auth pages - Apply immediately and persist
	const applyRTLDirection = React.useCallback(() => {
		const isDemo = globalSettings?.is_demo || false;
		const currentLang = userLanguage || globalSettings?.defaultLanguage || "en";
		const isRTLLanguage = ["ar", "he"].includes(currentLang);
		let dir = "ltr";

		const getCookie = (name: string): string | null => {
			if (typeof document === "undefined") return null;
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) {
				const cookieValue = parts.pop()?.split(";").shift();
				return cookieValue ? decodeURIComponent(cookieValue) : null;
			}
			return null;
		};

		// Check RTL setting from cookies/globalSettings
		const layoutDirection = isDemo
			? getCookie("layoutDirection")
			: globalSettings?.layoutDirection;
		const isRTLSetting = layoutDirection === "right";

		// Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
		if (isRTLLanguage || isRTLSetting) {
			dir = "rtl";
		}

		// Apply direction immediately
		document.documentElement.dir = dir;
		document.documentElement.setAttribute("dir", dir);
		document.body.dir = dir;

		return dir;
	}, [
		userLanguage,
		globalSettings?.defaultLanguage,
		globalSettings?.is_demo,
		globalSettings?.layoutDirection,
	]);

	// Apply RTL on mount and when dependencies change
	React.useLayoutEffect(() => {
		const direction = applyRTLDirection();

		// Ensure direction persists after any DOM changes
		const observer = new MutationObserver(() => {
			if (document.documentElement.dir !== direction) {
				document.documentElement.dir = direction;
				document.documentElement.setAttribute("dir", direction);
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["dir"],
		});

		return () => observer.disconnect();
	}, [applyRTLDirection]);

	return (
		<div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900">
			<Head title={title} />

			{/* Left side - SVG illustration */}
			{/* <div
				className="hidden lg:block lg:w-1/2 relative overflow-hidden"
				style={{ backgroundColor: primaryColor }}
			>


				<div
					className="absolute inset-0"
					style={{ backgroundColor: primaryColor }}
				>
					<div className="h-full flex items-center justify-center p-8 relative z-10">
						<div className="max-w-[700px] mx-auto w-full">~ snip ~</div>
					</div>
				</div>
			</div> */}

			{/* Right side - Content */}
			{/* <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-slate-50 dark:bg-slate-900"> */}
			<div className="w-full flex items-center justify-center p-6 md:p-12 relative bg-slate-50 dark:bg-slate-900">
				{/* Enhanced Background Design */}
				<div className="absolute inset-0">
					{/* Base Gradient */}
					<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"></div>

					{/* Elegant Pattern Overlay */}
					<div
						className="absolute inset-0 opacity-100"
						style={{
							backgroundImage: `radial-gradient(circle at 30% 70%, ${primaryColor} 1px, transparent 1px)`,
							backgroundSize: "50px 50px",
						}}
					>
						<Grainient
							color1={analogColor1}
							color2={analogColor2}
							color3={analogColor3}
							timeSpeed={0.15}
							colorBalance={-0.38}
							warpStrength={1.2}
							warpFrequency={7.2}
							warpSpeed={2}
							warpAmplitude={50}
							blendAngle={0}
							blendSoftness={0.05}
							rotationAmount={500}
							noiseScale={2}
							grainAmount={0.1}
							grainScale={2}
							grainAnimated={false}
							contrast={2.5}
							gamma={10}
							saturation={0.2}
							centerX={0}
							centerY={0}
							zoom={0.8}
						/>
					</div>
				</div>

				{/* Language Switcher - Top Right */}
				<div className="absolute top-6 right-6 z-10">
					<LanguageSwitcher />
				</div>

				<div
					className={`w-full max-w-md transition-all duration-700 ${
						mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
					}`}
				>
					{/* Logo */}
					<div className="text-center m-20 mb-8">
						<div className="relative lg:inline-block pb-2 lg:px-6">
							{currentLogo ? (
								<img src={currentLogo} alt="Logo" className="w-auto mx-auto" />
							) : (
								<TrendingUpIcon
									className="h-8 w-auto mx-auto"
									style={{ color: primaryColor }}
								/>
							)}
						</div>
					</div>

					<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
						<div className="text-center mb-6">
							{icon && (
								<div
									className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									{icon}
								</div>
							)}
							<h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
								{title}
							</h1>
							{description && (
								<p className="text-slate-600 dark:text-slate-400">
									{description}
								</p>
							)}
						</div>

						{status && (
							<div
								className={`mb-6 text-center text-sm font-medium ${
									statusType === "success"
										? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30"
										: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30"
								} p-3 rounded-lg border`}
							>
								{status}
							</div>
						)}

						{children}
					</div>

					{/* Footer */}
					<div className="text-center mt-6">
						<div className="inline-flex items-center space-x-2 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-4 py-2 border border-gray-200 dark:border-slate-700">
							<p className="text-sm text-gray-500 dark:text-slate-400">
								© {currentYear} {appName}
							</p>
						</div>
					</div>
				</div>
			</div>
			<CookieConsentBanner />
		</div>
	);
}
