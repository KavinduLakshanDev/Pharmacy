import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Building2, Phone, MapPin, Upload } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import MediaPicker from '@/components/MediaPicker';
import { useTranslation } from 'react-i18next';
import { usePage, router } from '@inertiajs/react';

export default function CompanySettings() {
  const { t } = useTranslation();
  const { props } = usePage();
  const globalSettings = (props as any).globalSettings || {};

  const [settings, setSettings] = useState({
    companyName: globalSettings.companyName || '',
    companyPhone: globalSettings.companyPhone || '',
    companyAddress: globalSettings.companyAddress || '',
    companyLogo: globalSettings.companyLogo || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Sync settings when globalSettings change
  useEffect(() => {
    setSettings({
      companyName: globalSettings.companyName || '',
      companyPhone: globalSettings.companyPhone || '',
      companyAddress: globalSettings.companyAddress || '',
      companyLogo: globalSettings.companyLogo || '',
    });
  }, [globalSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const getDisplayUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (window as any).appSettings?.imageUrl || (window as any).appSettings?.baseUrl || '';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const saveSettings = () => {
    setIsLoading(true);

    router.post(route('settings.company.information.update'), settings, {
      preserveScroll: true,
      onSuccess: () => {
        setIsLoading(false);
        toast.success(t('Company settings updated successfully'));
      },
      onError: (errors) => {
        setIsLoading(false);
        const errorMessage = Object.values(errors).join(', ') || t('Failed to save company settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={t("Company Settings")}
      description={t("Manage your company profile information for receipts and documents")}
      action={
        <Button onClick={saveSettings} disabled={isLoading} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? t('Saving...') : t('Save Changes')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {t("Company Name")}
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={settings.companyName}
              onChange={handleInputChange}
              placeholder={t("Enter company name")}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="companyPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {t("Phone Number")}
            </Label>
            <Input
              id="companyPhone"
              name="companyPhone"
              value={settings.companyPhone}
              onChange={handleInputChange}
              placeholder={t("Enter company phone number")}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="companyAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {t("Address")}
            </Label>
            <Textarea
              id="companyAddress"
              name="companyAddress"
              value={settings.companyAddress}
              onChange={handleInputChange}
              placeholder={t("Enter company address")}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              {t("Company Logo")}
            </Label>
            <div className="flex flex-col gap-4">
              <div className="border rounded-lg p-6 flex items-center justify-center bg-muted/20 h-48 w-full overflow-hidden">
                {settings.companyLogo && !logoError ? (
                  <img
                    src={getDisplayUrl(settings.companyLogo)}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain transition-transform hover:scale-105"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-3">
                    <div className="h-16 w-32 bg-muted/40 flex items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs font-medium">
                      {logoError ? t("Failed to load image") : t("No logo uploaded")}
                    </p>
                  </div>
                )}
              </div>
              
              <MediaPicker
                label=""
                value={settings.companyLogo}
                onChange={(url) => {
                  setLogoError(false);
                  setSettings(prev => ({ ...prev, companyLogo: String(url) }));
                }}
                placeholder={t("Select or upload company logo")}
                showPreview={false}
              />
              <p className="text-[11px] text-muted-foreground italic">
                {t("Recommended size: 250x100px. Supports PNG, JPG, WebP.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
