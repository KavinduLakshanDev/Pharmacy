import { useForm } from '@inertiajs/react';
import { Lock, Phone, MapPin } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';

type RegisterForm = {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    password_confirmation: string;
};

export default function CustomerRegister() {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('customer-portal.register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t('Create Customer Account')}
            description={t('Register to access your purchase history and account details')}
        >
            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">
                            {t('Full Name')}
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t('Enter your full name')}
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">
                            {t('Email Address')}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t('Enter your email address')}
                        />
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">
                            {t('Phone Number')}
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder={t('Enter your phone number')}
                                className="pl-10"
                            />
                        </div>
                        <InputError message={errors.phone} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="address" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">
                            {t('Address')}
                        </Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder={t('Enter your address')}
                                className="pl-10 resize-none"
                                rows={2}
                            />
                        </div>
                        <InputError message={errors.address} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">
                            {t('Password')}
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={t('Create a password')}
                                className="pl-10"
                            />
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">
                            {t('Confirm Password')}
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder={t('Confirm your password')}
                                className="pl-10"
                            />
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-1" />
                    </div>
                </div>

                <AuthButton processing={processing}>
                    {t('Create Account')}
                </AuthButton>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('Already have an account?')}{' '}
                    <TextLink href={route('login')}>{t('Sign in')}</TextLink>
                </p>
            </form>
        </AuthLayout>
    );
}
