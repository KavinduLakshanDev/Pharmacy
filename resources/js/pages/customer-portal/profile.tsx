import { useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MapPin, Mail, User, Camera } from 'lucide-react';
import CustomerPortalLayout from '@/layouts/customer-portal-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';

interface Customer {
    id: number;
    name: string;
    code: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    avatar: string | null;
    avatar_url: string | null;
}

interface ProfileProps {
    customer: Customer | null;
    user: { name: string; email: string };
}

export default function CustomerProfile({ customer, user }: ProfileProps) {
    const { t } = useTranslation();
    const { flash } = usePage().props as any;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(customer?.avatar_url ?? null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: customer?.name ?? user.name,
        email: user.email,
        phone: customer?.phone ?? '',
        address: customer?.address ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('customer-portal.profile.update'));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setAvatarPreview(preview);
        setUploadingAvatar(true);
        router.post(route('customer-portal.profile.avatar'), { avatar: file }, {
            forceFormData: true,
            onFinish: () => setUploadingAvatar(false),
        });
    };

    return (
        <CustomerPortalLayout title={t('Profile')}>
            <div className="space-y-6 max-w-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('My Profile')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('Manage your account details')}
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                {/* Avatar upload */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('Profile Photo')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-5">
                        <div className="relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt={t('Profile photo')}
                                    className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                                aria-label={t('Change photo')}
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingAvatar}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadingAvatar ? t('Uploading...') : t('Change Photo')}
                            </Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('JPG, PNG or GIF. Max 2MB.')}</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </CardContent>
                </Card>

                {/* Read-only info */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('Account Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0">{t('Email')}</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{user.email}</span>
                        </div>
                        {customer?.code && (
                            <div className="flex items-center gap-3 text-sm">
                                <User className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0">{t('Code')}</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">{customer.code}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Editable profile */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t('Edit Profile')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">{t('Full Name')}</Label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="pl-10"
                                        placeholder={t('Enter your full name')}
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="email">{t('Email address')}</Label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="pl-10"
                                        placeholder={t('Enter your email')}
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="phone">{t('Phone Number')}</Label>
                                <div className="relative mt-1">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="pl-10"
                                        placeholder={t('Enter your phone number')}
                                    />
                                </div>
                                <InputError message={errors.phone} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="address">{t('Address')}</Label>
                                <div className="relative mt-1">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="pl-10 resize-none"
                                        rows={3}
                                        placeholder={t('Enter your address')}
                                    />
                                </div>
                                <InputError message={errors.address} className="mt-1" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('Saving...') : t('Save Changes')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </CustomerPortalLayout>
    );
}
