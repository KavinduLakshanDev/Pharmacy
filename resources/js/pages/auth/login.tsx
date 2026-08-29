import { useForm, router } from "@inertiajs/react";
import { FormEventHandler, useState, useEffect } from "react";

import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import AuthLayout from "@/layouts/auth-layout";
import AuthButton from "@/components/auth/auth-button";
import Recaptcha, { useRecaptchaSettings } from "@/components/recaptcha";
import { useBrand } from "@/contexts/BrandContext";
import { THEME_COLORS } from "@/hooks/use-appearance";
import { AtSignIcon } from "@/components/icons/at-sign";
import { KeyCircleIcon } from "@/components/icons/key-circle";

type LoginForm = {
	email: string;
	password: string;
	remember: boolean;
	recaptcha_token?: string;
};

interface Business {
	id: number;
	name: string;
	slug: string;
	business_type: string;
}

interface LoginProps {
	status?: string;
	canResetPassword: boolean;
	demoBusinesses?: Business[];
}

export default function Login({
	status,
	canResetPassword,
	demoBusinesses = [],
}: LoginProps) {
	const { t } = useTranslation();
	const [recaptchaToken, setRecaptchaToken] = useState<string>("");
	const { themeColor, customColor } = useBrand();
	const primaryColor =
		themeColor === "custom"
			? customColor
			: THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
	const [isDemo, setIsDemo] = useState<boolean>(false);
	const { recaptchaEnabled } = useRecaptchaSettings();
	const [showRecaptchaError, setShowRecaptchaError] = useState<boolean>(false);

	const [emailFocused, setEmailFocused] = useState(false);
	const [passwordFocused, setPasswordFocused] = useState(false);

	// Always show business buttons by default
	const [showBusinessButtons, setShowBusinessButtons] = useState<boolean>(true);

	const { data, setData, post, processing, errors, reset } = useForm<LoginForm>(
		{
			email: "",
			password: "",
			remember: false,
		},
	);

	useEffect(() => {
		// Check if demo mode is enabled
		const isDemoMode = (window as any).isDemo === true;
		setIsDemo(isDemoMode);

		// Set default credentials if in demo mode
		if (isDemoMode) {
			setData({
				email: "company@example.com",
				password: "password",
				remember: false,
			});
		}
	}, []);

	const submit: FormEventHandler = (e) => {
		e.preventDefault();

		// Check if reCAPTCHA is enabled and token is missing
		if (recaptchaEnabled && !recaptchaToken) {
			setShowRecaptchaError(true);
			return;
		}

		setShowRecaptchaError(false);
		router.post(route("login"), { ...data, recaptcha_token: recaptchaToken ?? '' }, {
			onFinish: () => reset("password"),
		});
	};

	// No longer needed as we're using router.post directly in the button handlers

	const openBusinessInNewTab = (
		businessId: number,
		slug: string,
		e: React.MouseEvent,
	) => {
		// Prevent the default form submission
		e.preventDefault();
		e.stopPropagation();

		// Use the same URL structure as in vcard-builder/index.tsx
		const url = route("public.vcard.show.direct", slug);
		window.open(url, "_blank");
	};

	return (
		<AuthLayout
			title={t("Log in to your account")}
			description={t("Enter your credentials to access your account")}
			status={status}
		>
			<form className="space-y-5" onSubmit={submit}>
				<div className="space-y-4">
					<div className="relative">
						<Label
							htmlFor="email"
							className="text-gray-700 dark:text-gray-300 font-medium mb-1 block"
						>
							{t("Email address")}
						</Label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<AtSignIcon
									isFocused={emailFocused}
									size={20}
									className=" text-gray-400"
								/>
							</div>
							<Input
								id="email"
								type="email"
								required
								autoFocus
								tabIndex={1}
								autoComplete="email"
								value={data.email}
								onChange={(e) => setData("email", e.target.value)}
								onFocus={() => setEmailFocused(true)}
								onBlur={() => setEmailFocused(false)}
								placeholder="email@example.com"
								className="pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200"
								style={
									{
										"--tw-ring-color": primaryColor,
									} as React.CSSProperties
								}
							/>
						</div>
						<InputError message={errors.email} />
					</div>

					<div>
						{/* <div className="flex items-center justify-between mb-1">
										<Label
											htmlFor="password"
											className="text-gray-700 dark:text-gray-300 font-medium"
										>
											{t("Password")}
										</Label>
										{canResetPassword && (
											<TextLink
												href={route("password.request")}
												className="text-sm transition-colors duration-200"
												style={{ color: primaryColor }}
												tabIndex={5}
											>
												{t("Forgot password?")}
											</TextLink>
										)}
									</div> */}
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<KeyCircleIcon
									isFocused={passwordFocused}
									size={20}
									className=" text-gray-400"
								/>
							</div>
							<Input
								id="password"
								type="password"
								required
								tabIndex={2}
								autoComplete="current-password"
								value={data.password}
								onChange={(e) => setData("password", e.target.value)}
								onFocus={() => setPasswordFocused(true)}
								onBlur={() => setPasswordFocused(false)}
								placeholder="••••••••"
								className="w-full rounded-lg border-gray-300 dark:border-gray-600 pl-10 bg-white dark:bg-gray-700  transition-all duration-200"
								style={
									{
										"--tw-ring-color": primaryColor,
									} as React.CSSProperties
								}
							/>
						</div>
						<InputError message={errors.password} />
					</div>

					<div className="flex items-center">
						<Checkbox
							id="remember"
							name="remember"
							checked={data.remember}
							onClick={() => setData("remember", !data.remember)}
							tabIndex={3}
							className="border-gray-300 rounded"
							style={
								{
									"--tw-ring-color": primaryColor,
									color: primaryColor,
								} as React.CSSProperties
							}
						/>
						<Label
							htmlFor="remember"
							className="ml-2 text-gray-600 dark:text-gray-400"
						>
							{t("Remember me")}
						</Label>
					</div>
				</div>

				<Recaptcha
					onVerify={(token) => {
						setRecaptchaToken(token);
						setShowRecaptchaError(false);
					}}
					onExpired={() => setRecaptchaToken("")}
					onError={() => setRecaptchaToken("")}
				/>

				{showRecaptchaError && recaptchaEnabled && !recaptchaToken && (
					<p className="text-sm text-red-600 dark:text-red-400 text-center -mt-2">
						{t("Please complete the reCAPTCHA verification")}
					</p>
				)}

				<AuthButton className="mb-0" tabIndex={4} processing={processing}>
					{t("Log in")}
				</AuthButton>

				{/* <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    {t("Don't have an account?")}{' '}
                    <TextLink
                        href={route('register')}
                        className="font-medium transition-colors duration-200"
                        style={{ color: primaryColor }}
                        tabIndex={6}
                    >
                        {t("Sign up")}
                    </TextLink>
                </div> */}

				<div className="text-center text-sm text-gray-600 dark:text-gray-400">
					{t("Are you a customer?")}{' '}
					<TextLink
						href={route('customer-portal.register')}
						className="font-medium transition-colors duration-200"
						style={{ color: primaryColor }}
						tabIndex={7}
					>
						{t("Register here")}
					</TextLink>
				</div>
			</form>
		</AuthLayout>
	);
}
