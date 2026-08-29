import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, usePage } from '@inertiajs/react';
import { Gift, Info, Loader2, Save } from 'lucide-react';
import { FormEvent, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

type RuleProps = {
    rule: {
        currency_amount: string;
        points_earned: number;
        redemption_points: number;
        redemption_amount: string;
    };
};

function previewPointsExample(currencyAmount: number, pointsEarned: number, exampleBill = 500): number {
    if (currencyAmount <= 0 || pointsEarned <= 0) {
        return 0;
    }
    return Math.round(((exampleBill / currencyAmount) * pointsEarned) * 100) / 100;
}

export default function PointsEarningRulesCreate() {
    const { t } = useTranslation();
    const { rule, flash } = usePage<RuleProps & { flash?: { success?: string } }>().props;

    const { data, setData, post, processing, errors } = useForm({
        currency_amount: rule.currency_amount,
        points_earned: String(rule.points_earned),
        redemption_points: String(rule.redemption_points ?? '1'),
        redemption_amount: String(rule.redemption_amount ?? '1.00'),
    });

    const currencyNum = Number.parseFloat(data.currency_amount) || 0;
    const pointsNum = Number.parseFloat(data.points_earned) || 0;
    const redemptionPointsNum = Number.parseFloat(data.redemption_points) || 0;
    const redemptionAmountNum = Number.parseFloat(data.redemption_amount) || 0;

    const exampleEarned = useMemo(() => previewPointsExample(currencyNum, pointsNum, 500), [currencyNum, pointsNum]);

    const exampleRedemption = useMemo(() => {
        if (redemptionPointsNum <= 0 || redemptionAmountNum <= 0) {
            return 0;
        }
        return Math.round(((500 / redemptionPointsNum) * redemptionAmountNum) * 100) / 100;
    }, [redemptionPointsNum, redemptionAmountNum]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Sales Management'), href: route('sales.index') },
        { title: t('Points Earning Rules') },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('points-rules.store'), {
            preserveScroll: true,
            onError: () => {
                toast.error(t('Could not save the rule. Please check the form.'));
            },
        });
    };

    return (
        <PageTemplate
            title={t('Points Configuration')}
            description={t('Manage and configure loyalty points earning and redemption rules')}
            url={route('points-rules.create')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="mx-auto max-w-3xl space-y-6 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Configure Points Earning & Redemption Rules')}</CardTitle>
                        <CardDescription>{t('Set how customers earn points and the conversion rate for redeeming them.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">{t('Earning Rules')}</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency_amount">{t('Currency Amount (Rs)')}</Label>
                                        <Input
                                            id="currency_amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={data.currency_amount}
                                            onChange={(ev) => setData('currency_amount', ev.target.value)}
                                        />
                                        {errors.currency_amount && <p className="text-destructive text-sm">{errors.currency_amount}</p>}
                                        {!errors.currency_amount && (
                                            <p className="text-muted-foreground text-xs">{t('Amount of money required to earn points')}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="points_earned" className="flex items-center gap-2">
                                            <Gift className="text-muted-foreground h-4 w-4" />
                                            {t('Points Earned')}
                                        </Label>
                                        <Input
                                            id="points_earned"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={data.points_earned}
                                            onChange={(ev) => setData('points_earned', ev.target.value)}
                                        />
                                        {errors.points_earned && <p className="text-destructive text-sm">{errors.points_earned}</p>}
                                        {!errors.points_earned && <p className="text-muted-foreground text-xs">{t('Number of points to award')}</p>}
                                    </div>
                                </div>

                                <div className="bg-muted/60 rounded-lg border p-4">
                                    <p className="text-sm font-medium">
                                        {t('Earning Rate')}:{' '}
                                        <span className="text-primary font-bold">
                                            Rs. {currencyNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ={' '}
                                            {pointsNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {t('Points')}
                                        </span>
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {t('Example')}: Rs. 500 {t('Earns')} {exampleEarned} {t('Points')}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">{t('Redemption Rules')}</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="redemption_points">{t('Points to Redeem')}</Label>
                                        <Input
                                            id="redemption_points"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={data.redemption_points}
                                            onChange={(ev) => setData('redemption_points', ev.target.value)}
                                        />
                                        {errors.redemption_points && <p className="text-destructive text-sm">{errors.redemption_points}</p>}
                                        {!errors.redemption_points && (
                                            <p className="text-muted-foreground text-xs">{t('Number of points required for redemption')}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="redemption_amount" className="flex items-center gap-2">
                                            {t('Cash Value (Rs)')}
                                        </Label>
                                        <Input
                                            id="redemption_amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={data.redemption_amount}
                                            onChange={(ev) => setData('redemption_amount', ev.target.value)}
                                        />
                                        {errors.redemption_amount && <p className="text-destructive text-sm">{errors.redemption_amount}</p>}
                                        {!errors.redemption_amount && <p className="text-muted-foreground text-xs">{t('Discount amount given for redeemed points')}</p>}
                                    </div>
                                </div>

                                <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 p-4 text-emerald-950">
                                    <p className="text-sm font-medium">
                                        {t('Redemption Rate')}:{' '}
                                        <span className="text-emerald-700 font-bold">
                                            {redemptionPointsNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {t('Points')} ={' '}
                                            Rs. {redemptionAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </p>
                                    <p className="text-emerald-800/80 mt-1 text-xs">
                                        {t('Example')}: 500 {t('Points can be redeemed for Rs.')} {exampleRedemption.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('discount')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {t('Save Rules')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Info className="text-muted-foreground h-4 w-4" />
                            {t('How Loyalty Points Work')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-3 text-sm">
                        <p>
                            <strong className="text-foreground">{t('Calculation formula')}:</strong>{' '}
                            {t('Points = (Total Bill Amount ÷ Currency Amount) × Points Earned')} ({t('rounded to 2 decimal places')}).
                        </p>
                        <p>
                            <strong className="text-foreground">{t('Redemption conversion')}:</strong>{' '}
                            {t('Discount = (Redeemed Points ÷ Points to Redeem) × Cash Value')}. {t('Points are deducted immediately from customer balance upon successful transaction.')}
                        </p>
                        <p>
                            <strong className="text-foreground">{t('One active ruleset')}:</strong>{' '}
                            {t('Earning and redemption policies apply immediately across the entire company POS sales workflow.')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
