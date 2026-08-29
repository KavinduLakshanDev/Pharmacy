<?php

use App\Http\Controllers\AccountCommentController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AccountIndustryController;
use App\Http\Controllers\AccountTypeController;
use App\Http\Controllers\ApprovedStockTransferReportController;
use App\Http\Controllers\BankPaymentController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CallController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\CampaignTypeController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\CashCollectionReportController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChatGptController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\CookieConsentController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerDetailsReportController;
use App\Http\Controllers\CustomerLedgerCardController;
use App\Http\Controllers\CustomerPortal\CustomerPortalController;
use App\Http\Controllers\CustomerPortal\CustomerRegistrationController as CustomerPortalRegistrationController;
use App\Http\Controllers\CustomerPortal\PrescriptionController as CustomerPrescriptionController;
use App\Http\Controllers\CustomerReturnController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\DeliveryRouteController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentFolderController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\DrugDestroyController;
use App\Http\Controllers\DrugFormController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\Finance\FinanceAccountController;
use App\Http\Controllers\Finance\FinanceDashboardController;
use App\Http\Controllers\Finance\FinanceTransactionController;
use App\Http\Controllers\Finance\PettyCashController;
use App\Http\Controllers\GenericNameController;
use App\Http\Controllers\ImpersonateController;
use App\Http\Controllers\Inventory\InventoryDashboardController;
use App\Http\Controllers\Inventory\ProductLookupController;
use App\Http\Controllers\InventoryTransactionController;
use App\Http\Controllers\InvoiceBankPaymentController;
use App\Http\Controllers\InvoiceBenefitPaymentController;
use App\Http\Controllers\InvoiceCommentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoicePayHerePaymentController;
use App\Http\Controllers\InvoicePayPalPaymentController;
use App\Http\Controllers\InvoiceStripePaymentController;
use App\Http\Controllers\LandingPage\CustomPageController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\LeadCommentController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\LeadStatusController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\OpportunityCommentController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\OpportunitySourceController;
use App\Http\Controllers\OpportunityStageController;
use App\Http\Controllers\PayHerePaymentController;
use App\Http\Controllers\PayPalPaymentController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanOrderController;
use App\Http\Controllers\PlanRequestController;
use App\Http\Controllers\PointsEarningRuleController;
use App\Http\Controllers\PosSessionController;
use App\Http\Controllers\PrescriptionManagementController;
use App\Http\Controllers\PriceDetailsReportController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectTaskController;
use App\Http\Controllers\PublicStorageFileController;
use App\Http\Controllers\PurchaseOrderCommentController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\QuoteCommentController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReceiptOrderController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ReturnOrderController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalesOrderCommentController;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\SalesReportController;
use App\Http\Controllers\SalesTransactionController;
use App\Http\Controllers\Settings\SystemSettingsController;
use App\Http\Controllers\ShippingProviderTypeController;
use App\Http\Controllers\StockBinCardController;
use App\Http\Controllers\StockInHandController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\StripePaymentController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierDetailsReportController;
use App\Http\Controllers\SupplierLedgerCardController;
use App\Http\Controllers\SupplierReturnController;
use App\Http\Controllers\TargetListController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WastageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::match(['GET', 'HEAD'], '/', [LandingPageController::class, 'show'])->name('home');

Route::get('/landing-page', [LandingPageController::class, 'settings'])->name('landing-page');
Route::post('/landing-page/contact', [LandingPageController::class, 'submitContact'])->name('landing-page.contact');
Route::post('/landing-page/subscribe', [LandingPageController::class, 'subscribe'])->name('landing-page.subscribe');
Route::get('/page/{slug}', [CustomPageController::class, 'show'])->name('custom-page.show');

Route::get('/translations/{locale}', [TranslationController::class, 'getTranslations'])->name('translations');
Route::get('/refresh-language/{locale}', [TranslationController::class, 'refreshLanguage'])->name('refresh-language');
Route::get('/initial-locale', [TranslationController::class, 'getInitialLocale'])->name('initial-locale');
Route::post('/change-language', [TranslationController::class, 'changeLanguage'])->name('change-language');

Route::get('/storage/{path}', PublicStorageFileController::class)
    ->where('path', '.*')
    ->name('public-storage.file');

// Email Templates routes (no middleware for testing)
Route::get('email-templates', [EmailTemplateController::class, 'index'])->name('email-templates.index');
Route::get('email-templates/{emailTemplate}', [EmailTemplateController::class, 'show'])->name('email-templates.show');
Route::put('email-templates/{emailTemplate}/settings', [EmailTemplateController::class, 'updateSettings'])->name('email-templates.update-settings');
Route::put('email-templates/{emailTemplate}/content', [EmailTemplateController::class, 'updateContent'])->name('email-templates.update-content');

// Customer registration routes
Route::get('customer/register', [CustomerController::class, 'create'])->name('customer.register');
Route::post('customer/register', [CustomerController::class, 'store'])->name('customer.register.store');
Route::get('customer/register/success', function () {
    return Inertia::render('Customer/Success');
})->name('customer.register.success');

// Customer portal routes
Route::middleware('guest')->prefix('customer-portal')->group(function () {
    Route::get('register', [CustomerPortalRegistrationController::class, 'create'])->name('customer-portal.register');
    Route::post('register', [CustomerPortalRegistrationController::class, 'store'])->name('customer-portal.register.store');
});

Route::middleware(['auth', 'customer'])->prefix('customer-portal')->name('customer-portal.')->group(function () {
    Route::get('dashboard', [CustomerPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('profile', [CustomerPortalController::class, 'profile'])->name('profile');
    Route::put('profile', [CustomerPortalController::class, 'updateProfile'])->name('profile.update');
    Route::post('profile/avatar', [CustomerPortalController::class, 'updateAvatar'])->name('profile.avatar');
    Route::get('prescriptions', [CustomerPrescriptionController::class, 'index'])->name('prescriptions.index');
    Route::post('prescriptions', [CustomerPrescriptionController::class, 'store'])->name('prescriptions.store');
    Route::post('prescriptions/{prescription}/messages', [CustomerPrescriptionController::class, 'sendMessage'])->name('prescriptions.messages.store');
    Route::get('prescriptions/{prescription}/invoice', [CustomerPrescriptionController::class, 'invoice'])->name('prescriptions.invoice');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Plans routes - accessible without plan check
    Route::get('plans', [PlanController::class, 'index'])->name('plans.index');
    Route::post('plans/request', [PlanController::class, 'requestPlan'])->name('plans.request');
    Route::post('plans/trial', [PlanController::class, 'startTrial'])->name('plans.trial');
    Route::post('plans/subscribe', [PlanController::class, 'subscribe'])->name('plans.subscribe');
    Route::post('plans/coupons/validate', [CouponController::class, 'validate'])->name('coupons.validate');

    // Payment routes - accessible without plan check
    Route::post('payments/stripe', [StripePaymentController::class, 'processPayment'])->name('stripe.payment');
    Route::post('payments/paypal', [PayPalPaymentController::class, 'processPayment'])->name('paypal.payment');
    Route::post('payments/bank', [BankPaymentController::class, 'processPayment'])->name('bank.payment');
    Route::post('payments/payhere', [PayHerePaymentController::class, 'processPayment'])->name('payhere.payment');

    // Other payment creation routes
    Route::post('payhere/create-payment', [PayHerePaymentController::class, 'createPayment'])->name('payhere.create-payment');

    // Payment success/callback routes
    Route::get('payments/payhere/success', [PayHerePaymentController::class, 'success'])->name('payhere.success');
    Route::post('payments/payhere/callback', [PayHerePaymentController::class, 'callback'])->name('payhere.callback');

    // All other routes require plan access check
    Route::middleware('plan.access')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('dashboard/redirect', [DashboardController::class, 'redirectToFirstAvailablePage'])->name('dashboard.redirect');

        Route::get('media-library', function () {
            return Inertia::render('media-library');
        })->name('media-library');

        // Media Library API routes
        Route::get('api/media', [MediaController::class, 'index'])->middleware('permission:manage-media')->name('api.media.index');
        Route::post('api/media/batch', [MediaController::class, 'batchStore'])->middleware('permission:create-media')->name('api.media.batch');
        Route::get('api/media/{id}/download', [MediaController::class, 'download'])->middleware('permission:download-media')->name('api.media.download');
        Route::delete('api/media/{id}', [MediaController::class, 'destroy'])->middleware('permission:delete-media')->name('api.media.destroy');

        // Storage settings API
        Route::get('api/storage-settings', [SystemSettingsController::class, 'getStorageSettings'])->name('api.storage-settings');

        // Notification Templates routes
        Route::middleware('permission:manage-notification-templates')->group(function () {
            Route::get('notification-templates', [\App\Http\Controllers\NotificationTemplateController::class, 'index'])->name('notification-templates.index');
            Route::get('notification-templates/{notificationTemplate}', [\App\Http\Controllers\NotificationTemplateController::class, 'show'])->name('notification-templates.show');
            Route::put('notification-templates/{notificationTemplate}/content', [\App\Http\Controllers\NotificationTemplateController::class, 'updateContent'])->name('notification-templates.update-content');
        });

        // Permissions routes with granular permissions
        Route::middleware('permission:manage-permissions')->group(function () {
            Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:manage-permissions')->name('permissions.index');
            Route::get('permissions/create', [PermissionController::class, 'create'])->middleware('permission:create-permissions')->name('permissions.create');
            Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:create-permissions')->name('permissions.store');
            Route::get('permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:view-permissions')->name('permissions.show');
            Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])->middleware('permission:edit-permissions')->name('permissions.edit');
            Route::put('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions')->name('permissions.update');
            Route::patch('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions');
            Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:delete-permissions')->name('permissions.destroy');
        });

        // Branches routes with granular permissions
        Route::middleware('permission:manage-branches')->group(function () {
            Route::get('branches', [BranchController::class, 'index'])->middleware('permission:manage-branches')->name('branches.index');
            Route::post('branches', [BranchController::class, 'store'])->middleware('permission:create-branches')->name('branches.store');
            Route::put('branches/{branch}', [BranchController::class, 'update'])->middleware('permission:edit-branches')->name('branches.update');
            Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->middleware('permission:delete-branches')->name('branches.destroy');
            Route::put('branches/{branch}/toggle-status', [BranchController::class, 'toggleStatus'])->middleware('permission:toggle-status-branches')->name('branches.toggle-status');
        });

        // Cash Registers routes with granular permissions
        Route::middleware('permission:manage-cash-registers')->group(function () {
            Route::get('cash-registers', [CashRegisterController::class, 'index'])->middleware('permission:view-cash-registers')->name('cash-registers.index');
            Route::post('cash-registers', [CashRegisterController::class, 'store'])->middleware('permission:create-cash-registers')->name('cash-registers.store');
            Route::put('cash-registers/{cashRegister}', [CashRegisterController::class, 'update'])->middleware('permission:edit-cash-registers')->name('cash-registers.update');
            Route::delete('cash-registers/{cashRegister}', [CashRegisterController::class, 'destroy'])->middleware('permission:delete-cash-registers')->name('cash-registers.destroy');
            Route::put('cash-registers/{cashRegister}/toggle-status', [CashRegisterController::class, 'toggleStatus'])->middleware('permission:toggle-status-cash-registers')->name('cash-registers.toggle-status');
        });

        // POS Sessions routes with granular permissions
        Route::middleware('permission:manage-pos-sessions')->group(function () {
            Route::get('pos-sessions', [PosSessionController::class, 'index'])->middleware('permission:view-pos-sessions')->name('pos-sessions.index');
            Route::post('pos-sessions', [PosSessionController::class, 'store'])->middleware('permission:create-pos-sessions')->name('pos-sessions.store');
            Route::put('pos-sessions/{posSession}', [PosSessionController::class, 'update'])->middleware('permission:edit-pos-sessions')->name('pos-sessions.update');
            Route::delete('pos-sessions/{posSession}', [PosSessionController::class, 'destroy'])->middleware('permission:delete-pos-sessions')->name('pos-sessions.destroy');
            Route::put('pos-sessions/{posSession}/close', [PosSessionController::class, 'close'])->middleware('permission:close-pos-sessions')->name('pos-sessions.close');
        });

        // Roles routes with granular permissions
        Route::middleware('permission:manage-roles')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->middleware('permission:manage-roles')->name('roles.index');
            Route::get('roles/create', [RoleController::class, 'create'])->middleware('permission:create-roles')->name('roles.create');
            Route::post('roles', [RoleController::class, 'store'])->middleware('permission:create-roles')->name('roles.store');
            Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:view-roles')->name('roles.show');
            Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:edit-roles')->name('roles.edit');
            Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles')->name('roles.update');
            Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete-roles')->name('roles.destroy');
        });

        // Users routes with granular permissions
        Route::middleware('permission:manage-users')->group(function () {
            Route::get('users', [UserController::class, 'index'])->middleware('permission:manage-users')->name('users.index');
            Route::get('users/create', [UserController::class, 'create'])->middleware('permission:create-users')->name('users.create');
            Route::post('users', [UserController::class, 'store'])->middleware('permission:create-users')->name('users.store');
            Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:view-users')->name('users.show');
            Route::get('users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:edit-users')->name('users.edit');
            Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users')->name('users.update');
            Route::patch('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete-users')->name('users.destroy');

            // Additional user routes
            Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:reset-password-users')->name('users.reset-password');
            Route::put('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->middleware('permission:toggle-status-users')->name('users.toggle-status');
            Route::get('users-logs', [UserController::class, 'allUserLogs'])->middleware('permission:view-users')->name('users.all-logs');
        });

        // Plans management routes (admin only)
        Route::middleware('permission:manage-plans')->group(function () {
            Route::get('plans/create', [PlanController::class, 'create'])->middleware('permission:create-plans')->name('plans.create');
            Route::post('plans', [PlanController::class, 'store'])->middleware('permission:create-plans')->name('plans.store');
            Route::get('plans/{plan}/edit', [PlanController::class, 'edit'])->middleware('permission:edit-plans')->name('plans.edit');
            Route::put('plans/{plan}', [PlanController::class, 'update'])->middleware('permission:edit-plans')->name('plans.update');
            Route::delete('plans/{plan}', [PlanController::class, 'destroy'])->middleware('permission:delete-plans')->name('plans.destroy');
            Route::post('plans/{plan}/toggle-status', [PlanController::class, 'toggleStatus'])->name('plans.toggle-status');
        });

        // Plan Orders routes
        Route::middleware('permission:manage-plan-orders')->group(function () {
            Route::get('plan-orders', [PlanOrderController::class, 'index'])->middleware('permission:manage-plan-orders')->name('plan-orders.index');
            Route::post('plan-orders/{planOrder}/approve', [PlanOrderController::class, 'approve'])->middleware('permission:approve-plan-orders')->name('plan-orders.approve');
            Route::post('plan-orders/{planOrder}/reject', [PlanOrderController::class, 'reject'])->middleware('permission:reject-plan-orders')->name('plan-orders.reject');
        });

        // Plan Requests routes (placeholder)
        Route::get('plan-requests', function () {
            return Inertia::render('plans/plan-requests');
        })->name('plan-requests.index');

        // Companies routes
        Route::middleware('permission:manage-companies')->group(function () {
            Route::get('companies', [CompanyController::class, 'index'])->middleware('permission:manage-companies')->name('companies.index');
            Route::post('companies', [CompanyController::class, 'store'])->middleware('permission:create-companies')->name('companies.store');
            Route::put('companies/{company}', [CompanyController::class, 'update'])->middleware('permission:edit-companies')->name('companies.update');
            Route::delete('companies/{company}', [CompanyController::class, 'destroy'])->middleware('permission:delete-companies')->name('companies.destroy');
            Route::put('companies/{company}/reset-password', [CompanyController::class, 'resetPassword'])->middleware('permission:reset-password-companies')->name('companies.reset-password');
            Route::put('companies/{company}/toggle-status', [CompanyController::class, 'toggleStatus'])->middleware('permission:toggle-status-companies')->name('companies.toggle-status');
            Route::get('companies/{company}/plans', [CompanyController::class, 'getPlans'])->middleware('permission:manage-plans-companies')->name('companies.plans');
            Route::put('companies/{company}/upgrade-plan', [CompanyController::class, 'upgradePlan'])->middleware('permission:upgrade-plan-companies')->name('companies.upgrade-plan');
        });

        // Coupons routes
        Route::middleware('permission:manage-coupons')->group(function () {
            Route::get('coupons', [CouponController::class, 'index'])->middleware('permission:manage-coupons')->name('coupons.index');
            Route::get('coupons/{coupon}', [CouponController::class, 'show'])->middleware('permission:view-coupons')->name('coupons.show');
            Route::post('coupons', [CouponController::class, 'store'])->middleware('permission:create-coupons')->name('coupons.store');
            Route::put('coupons/{coupon}', [CouponController::class, 'update'])->middleware('permission:edit-coupons')->name('coupons.update');
            Route::put('coupons/{coupon}/toggle-status', [CouponController::class, 'toggleStatus'])->middleware('permission:toggle-status-coupons')->name('coupons.toggle-status');
            Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->middleware('permission:delete-coupons')->name('coupons.destroy');
        });

        // Plan Requests routes
        Route::middleware('permission:manage-plan-requests')->group(function () {
            Route::get('plan-requests', [PlanRequestController::class, 'index'])->middleware('permission:manage-plan-requests')->name('plan-requests.index');
            Route::post('plan-requests/{planRequest}/approve', [PlanRequestController::class, 'approve'])->middleware('permission:approve-plan-requests')->name('plan-requests.approve');
            Route::post('plan-requests/{planRequest}/reject', [PlanRequestController::class, 'reject'])->middleware('permission:reject-plan-requests')->name('plan-requests.reject');
        });

        // Referral routes
        // Route::middleware('permission:manage-referral')->group(function () {
        //     Route::get('referral', [ReferralController::class, 'index'])->middleware('permission:manage-referral')->name('referral.index');
        //     Route::get('referral/referred-users', [ReferralController::class, 'getReferredUsers'])->middleware('permission:manage-users-referral')->name('referral.referred-users');
        //     Route::post('referral/settings', [ReferralController::class, 'updateSettings'])->middleware('permission:manage-setting-referral')->name('referral.settings.update');
        //     Route::post('referral/payout-request', [ReferralController::class, 'createPayoutRequest'])->middleware('permission:manage-payout-referral')->name('referral.payout-request.create');
        //     Route::post('referral/payout-request/{payoutRequest}/approve', [ReferralController::class, 'approvePayoutRequest'])->middleware('permission:approve-payout-referral')->name('referral.payout-request.approve');
        //     Route::post('referral/payout-request/{payoutRequest}/reject', [ReferralController::class, 'rejectPayoutRequest'])->middleware('permission:reject-payout-referral')->name('referral.payout-request.reject');
        // });

        // Currencies routes
        Route::middleware('permission:manage-currencies')->group(function () {
            Route::get('currencies', [CurrencyController::class, 'index'])->middleware('permission:manage-currencies')->name('currencies.index');
            Route::post('currencies', [CurrencyController::class, 'store'])->middleware('permission:create-currencies')->name('currencies.store');
            Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->middleware('permission:edit-currencies')->name('currencies.update');
            Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->middleware('permission:delete-currencies')->name('currencies.destroy');
        });

        // Taxes routes
        // Route::middleware('permission:manage-taxes')->group(function () {
        //     Route::get('taxes', [TaxController::class, 'index'])->middleware('permission:manage-taxes')->name('taxes.index');
        //     Route::post('taxes', [TaxController::class, 'store'])->middleware('permission:create-taxes')->name('taxes.store');
        //     Route::put('taxes/{tax}', [TaxController::class, 'update'])->middleware('permission:edit-taxes')->name('taxes.update');
        //     Route::delete('taxes/{tax}', [TaxController::class, 'destroy'])->middleware('permission:delete-taxes')->name('taxes.destroy');
        //     Route::put('taxes/{tax}/toggle-status', [TaxController::class, 'toggleStatus'])->middleware('permission:toggle-status-taxes')->name('taxes.toggle-status');
        // });

        // Brands routes
        Route::middleware('permission:manage-brands')->group(function () {
            Route::get('brands', [BrandController::class, 'index'])->middleware('permission:manage-brands')->name('brands.index');
            Route::post('brands', [BrandController::class, 'store'])->middleware('permission:create-brands')->name('brands.store');
            Route::put('brands/{brand}', [BrandController::class, 'update'])->middleware('permission:edit-brands')->name('brands.update');
            Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:delete-brands')->name('brands.destroy');
            Route::put('brands/{brand}/toggle-status', [BrandController::class, 'toggleStatus'])->middleware('permission:toggle-status-brands')->name('brands.toggle-status');
        });

        // Categories routes
        Route::middleware('permission:manage-categories')->group(function () {
            Route::get('categories', [CategoryController::class, 'index'])->middleware('permission:manage-categories')->name('categories.index');
            Route::post('categories', [CategoryController::class, 'store'])->middleware('permission:create-categories')->name('categories.store');
            Route::put('categories/{category}', [CategoryController::class, 'update'])->middleware('permission:edit-categories')->name('categories.update');
            Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:delete-categories')->name('categories.destroy');
            Route::put('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus'])->middleware('permission:toggle-status-categories')->name('categories.toggle-status');
        });

        // Generic Names routes
        Route::middleware('permission:manage-generic-names')->group(function () {
            Route::get('generic-names', [GenericNameController::class, 'index'])->middleware('permission:manage-generic-names')->name('generic-names.index');
            Route::post('generic-names', [GenericNameController::class, 'store'])->middleware('permission:create-generic-names')->name('generic-names.store');
            Route::put('generic-names/{genericName}', [GenericNameController::class, 'update'])->middleware('permission:edit-generic-names')->name('generic-names.update');
            Route::delete('generic-names/{genericName}', [GenericNameController::class, 'destroy'])->middleware('permission:delete-generic-names')->name('generic-names.destroy');
            Route::put('generic-names/{genericName}/toggle-status', [GenericNameController::class, 'toggleStatus'])->middleware('permission:toggle-status-generic-names')->name('generic-names.toggle-status');
        });

        // Drug Forms routes
        Route::middleware('permission:manage-drug-forms')->group(function () {
            Route::get('drug-forms', [DrugFormController::class, 'index'])->middleware('permission:manage-drug-forms')->name('drug-forms.index');
            Route::post('drug-forms', [DrugFormController::class, 'store'])->middleware('permission:create-drug-forms')->name('drug-forms.store');
            Route::put('drug-forms/{drugForm}', [DrugFormController::class, 'update'])->middleware('permission:edit-drug-forms')->name('drug-forms.update');
            Route::delete('drug-forms/{drugForm}', [DrugFormController::class, 'destroy'])->middleware('permission:delete-drug-forms')->name('drug-forms.destroy');
            Route::put('drug-forms/{drugForm}/toggle-status', [DrugFormController::class, 'toggleStatus'])->middleware('permission:toggle-status-drug-forms')->name('drug-forms.toggle-status');
        });

        // Units routes
        Route::middleware('permission:manage-units')->group(function () {
            Route::get('units', [UnitController::class, 'index'])->middleware('permission:manage-units')->name('units.index');
            Route::post('units', [UnitController::class, 'store'])->middleware('permission:create-units')->name('units.store');
            Route::put('units/{unit}', [UnitController::class, 'update'])->middleware('permission:edit-units')->name('units.update');
            Route::delete('units/{unit}', [UnitController::class, 'destroy'])->middleware('permission:delete-units')->name('units.destroy');
            Route::put('units/{unit}/toggle-status', [UnitController::class, 'toggleStatus'])->middleware('permission:toggle-status-units')->name('units.toggle-status');
        });

        // Products routes
        Route::middleware('permission:manage-products')->group(function () {
            Route::get('products', [ProductController::class, 'index'])->middleware('permission:manage-products')->name('products.index');
            Route::get('products/create', [ProductController::class, 'create'])->middleware('permission:create-products')->name('products.create');
            Route::get('products/{product}', [ProductController::class, 'show'])->middleware('permission:view-products')->name('products.show');
            Route::get('products/{product}/edit', [ProductController::class, 'edit'])->middleware('permission:edit-products')->name('products.edit');
            Route::post('products', [ProductController::class, 'store'])->middleware('permission:create-products')->name('products.store');
            Route::put('products/{product}', [ProductController::class, 'update'])->middleware('permission:edit-products')->name('products.update');
            Route::delete('products/{product}/', [ProductController::class, 'destroy'])->middleware('permission:delete-products')->name('products.destroy');
            Route::put('products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])->middleware('permission:toggle-status-products')->name('products.toggle-status');
        });
        Route::middleware('permission:manage-sales|view-sales')->group(function () {
            Route::get('sales', [SalesTransactionController::class, 'index'])->name('sales.index');
            Route::get('sales/create', [SalesTransactionController::class, 'create'])->middleware('permission:manage-sales|create-sales')->name('sales.create');
            Route::get('sales/next-number', [SalesTransactionController::class, 'nextNumber'])->middleware('permission:manage-sales|create-sales')->name('sales.next-number');
            Route::get('sales/search/by-number', [SalesTransactionController::class, 'searchByNumber'])->middleware('permission:manage-sales|view-sales')->name('sales.search-by-number');
            Route::post('sales', [SalesTransactionController::class, 'store'])->middleware('permission:manage-sales|create-sales')->name('sales.store');
            Route::get('sales/{sales_transaction}', [SalesTransactionController::class, 'show'])->name('sales.show');
            Route::get('sales/{sales_transaction}/edit', [SalesTransactionController::class, 'edit'])->middleware('permission:manage-sales|edit-sales')->name('sales.edit');
            Route::put('sales/{sales_transaction}', [SalesTransactionController::class, 'update'])->middleware('permission:manage-sales|edit-sales')->name('sales.update');
            Route::delete('sales/{sales_transaction}', [SalesTransactionController::class, 'destroy'])->middleware('permission:manage-sales|delete-sales')->name('sales.destroy');
        });

        Route::middleware('permission:manage-points-earning-rules|manage-sales')->group(function (): void {
            Route::get('points-rules', [PointsEarningRuleController::class, 'create'])->name('points-rules.create');
            Route::post('points-rules', [PointsEarningRuleController::class, 'store'])->name('points-rules.store');
        });

        // Inventory routes
        Route::prefix('inventory')->name('inventory.')->middleware('permission:manage-inventory')->group(function () {
            Route::get('dashboard', [InventoryDashboardController::class, 'index'])
                ->middleware('permission:view-inventory-dashboard')->name('dashboard');

            Route::get('transactions', [InventoryTransactionController::class, 'index'])
                ->middleware('permission:view-inventory-transactions')
                ->name('transactions.index');

            Route::get('stock-in-hand', [StockInHandController::class, 'inventoryIndex'])
                ->middleware('permission:view-inventory-transactions')
                ->name('stock-in-hand');

            Route::get('product-lookup', [ProductLookupController::class, 'index'])
                ->middleware('permission:view-inventory-transactions')
                ->name('product-lookup');

            Route::get('product-lookup/{product}', [ProductLookupController::class, 'show'])
                ->middleware('permission:view-inventory-transactions')
                ->name('product-lookup.show');

            Route::get('audit', function () {
                return Inertia::render('inventory/audit');
            })->middleware('permission:view-inventory-audit')->name('audit');

            Route::get('stock-transfers', [StockTransferController::class, 'index'])->name('stock-transfers.index');
            Route::get('stock-transfers/create', [StockTransferController::class, 'create'])->name('stock-transfers.create');
            Route::post('stock-transfers', [StockTransferController::class, 'store'])->name('stock-transfers.store');
            Route::get('stock-transfers/{stock_transfer}', [StockTransferController::class, 'show'])->name('stock-transfers.show');
            Route::get('stock-transfers/{stock_transfer}/edit', [StockTransferController::class, 'edit'])->name('stock-transfers.edit');
            Route::put('stock-transfers/{stock_transfer}', [StockTransferController::class, 'update'])->name('stock-transfers.update');
            Route::delete('stock-transfers/{stock_transfer}', [StockTransferController::class, 'destroy'])->name('stock-transfers.destroy');
            Route::post('stock-transfers/{stock_transfer}/approve', [StockTransferController::class, 'approve'])->name('stock-transfers.approve');
            Route::post('stock-transfers/{stock_transfer}/accept', [StockTransferController::class, 'accept'])->name('stock-transfers.accept');
            Route::post('stock-transfers/{stock_transfer}/reject', [StockTransferController::class, 'reject'])->name('stock-transfers.reject');

            Route::get('wastages', [WastageController::class, 'index'])->name('wastages.index');
            Route::get('wastages/create', [WastageController::class, 'create'])->name('wastages.create');
            Route::post('wastages', [WastageController::class, 'store'])->name('wastages.store');
            Route::get('wastages/{wastage}', [WastageController::class, 'show'])->name('wastages.show');
            Route::post('wastages/{wastage}/approve', [WastageController::class, 'approve'])->name('wastages.approve');
            Route::delete('wastages/{wastage}', [WastageController::class, 'destroy'])->name('wastages.destroy');

            Route::get('drug-destroys', [DrugDestroyController::class, 'index'])->middleware('permission:view-drug-destroys|view-inventory-transactions')->name('drug-destroys.index');
            Route::post('drug-destroys', [DrugDestroyController::class, 'store'])->middleware('permission:create-drug-destroys|view-inventory-transactions')->name('drug-destroys.store');

            Route::get('supplier-payments', [\App\Http\Controllers\SupplierPaymentController::class, 'index'])->middleware('permission:view-inventory-transactions')->name('supplier-payments.index');
            Route::post('supplier-payments', [\App\Http\Controllers\SupplierPaymentController::class, 'store'])->middleware('permission:view-inventory-transactions')->name('supplier-payments.store');
            Route::get('supplier-payments/search-suppliers', [\App\Http\Controllers\SupplierPaymentController::class, 'searchSuppliers'])->middleware('permission:view-inventory-transactions')->name('supplier-payments.search-suppliers');
            Route::get('supplier-payments/supplier-details', [\App\Http\Controllers\SupplierPaymentController::class, 'supplierDetails'])->middleware('permission:view-inventory-transactions')->name('supplier-payments.supplier-details');
            Route::get('supplier-payments/{supplier_payment}/receipt', [\App\Http\Controllers\SupplierPaymentController::class, 'receipt'])->middleware('permission:view-inventory-transactions')->name('supplier-payments.receipt');
            Route::get('customer-payments', [\App\Http\Controllers\CustomerPaymentController::class, 'index'])->middleware('permission:view-inventory-transactions')->name('customer-payments.index');
            Route::post('customer-payments', [\App\Http\Controllers\CustomerPaymentController::class, 'store'])->middleware('permission:view-inventory-transactions')->name('customer-payments.store');
            Route::get('customer-payments/search-customers', [\App\Http\Controllers\CustomerPaymentController::class, 'searchCustomers'])->middleware('permission:view-inventory-transactions')->name('customer-payments.search-customers');
            Route::get('customer-payments/customer-details', [\App\Http\Controllers\CustomerPaymentController::class, 'customerDetails'])->middleware('permission:view-inventory-transactions')->name('customer-payments.customer-details');
            Route::get('supplier-returns/create', [SupplierReturnController::class, 'create'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.create');
            Route::get('supplier-returns', [SupplierReturnController::class, 'index'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.index');
            Route::get('supplier-returns/search-suppliers', [SupplierReturnController::class, 'searchSuppliers'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.search-suppliers');
            Route::get('supplier-returns/{supplier}/grns', [SupplierReturnController::class, 'supplierGrns'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.grns');
            Route::get('supplier-returns/grn-details/{grn}', [SupplierReturnController::class, 'grnDetails'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.grn-details');
            Route::get('supplier-returns/targets', [SupplierReturnController::class, 'returnTarget'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.targets');
            Route::post('supplier-returns', [SupplierReturnController::class, 'store'])->middleware('permission:view-inventory-transactions')->name('supplier-returns.store');

            Route::get('customer-returns/create', [CustomerReturnController::class, 'create'])->middleware('permission:view-inventory-transactions')->name('customer-returns.create');
            Route::get('customer-returns/search-customers', [CustomerReturnController::class, 'searchCustomers'])->middleware('permission:view-inventory-transactions')->name('customer-returns.search-customers');
            Route::get('customer-returns/sales', [CustomerReturnController::class, 'sales'])->middleware('permission:view-inventory-transactions')->name('customer-returns.sales');
            Route::get('customer-returns/search-products', [CustomerReturnController::class, 'searchProducts'])->middleware('permission:view-inventory-transactions')->name('customer-returns.search-products');
            Route::get('customer-returns/additional-product-batches', [CustomerReturnController::class, 'additionalProductBatches'])->middleware('permission:view-inventory-transactions')->name('customer-returns.additional-product-batches');
            Route::get('customer-returns/sale-details/{sales_transaction}', [CustomerReturnController::class, 'saleDetails'])->middleware('permission:view-inventory-transactions')->name('customer-returns.sale-details');
            Route::post('customer-returns', [CustomerReturnController::class, 'store'])->middleware('permission:view-inventory-transactions')->name('customer-returns.store');
            Route::get('customer-returns', [CustomerReturnController::class, 'index'])
                ->middleware('permission:view-inventory-transactions')
                ->name('customer-returns.index');
            Route::get('customer-returns/{customer_return}', [CustomerReturnController::class, 'show'])
                ->middleware('permission:view-inventory-transactions')
                ->name('customer-returns.show');

            // Prescription management
            Route::get('prescriptions', [PrescriptionManagementController::class, 'index'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.index');
            Route::get('prescriptions/products-search', [PrescriptionManagementController::class, 'productsSearch'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.products-search');
            Route::get('prescriptions/{prescription}', [PrescriptionManagementController::class, 'show'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.show');
            Route::put('prescriptions/{prescription}', [PrescriptionManagementController::class, 'update'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.update');
            Route::post('prescriptions/{prescription}/messages', [PrescriptionManagementController::class, 'sendMessage'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.messages.store');
            Route::get('prescriptions/{prescription}/invoice', [PrescriptionManagementController::class, 'viewInvoice'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.invoice.view');
            Route::post('prescriptions/{prescription}/invoice', [PrescriptionManagementController::class, 'generateInvoice'])
                ->middleware('permission:manage-prescriptions')
                ->name('prescriptions.invoice');

        });

        // Finance routes
        Route::prefix('finance')->name('finance.')->middleware('permission:manage-finance')->group(function () {
            Route::get('dashboard', [FinanceDashboardController::class, 'index'])->name('dashboard');

            Route::get('accounts', [FinanceAccountController::class, 'index'])->name('accounts.index');
            Route::get('accounts/create', [FinanceAccountController::class, 'create'])->name('accounts.create');
            Route::post('accounts', [FinanceAccountController::class, 'store'])->name('accounts.store');
            Route::get('accounts/{account}', [FinanceAccountController::class, 'show'])->name('accounts.show');
            Route::get('accounts/{account}/edit', [FinanceAccountController::class, 'edit'])->name('accounts.edit');
            Route::put('accounts/{account}', [FinanceAccountController::class, 'update'])->name('accounts.update');
            Route::delete('accounts/{account}', [FinanceAccountController::class, 'destroy'])->name('accounts.destroy');

            Route::get('transactions', [FinanceTransactionController::class, 'index'])->name('transactions.index');
            Route::post('transactions', [FinanceTransactionController::class, 'store'])->name('transactions.store');

            Route::get('pettycash', [PettyCashController::class, 'index'])->name('pettycash.index');
            Route::post('pettycash/entries', [PettyCashController::class, 'storeEntry'])->name('pettycash.entries.store');
            Route::delete('pettycash/entries/{entry}', [PettyCashController::class, 'destroyEntry'])->name('pettycash.entries.destroy');
            Route::post('pettycash/categories', [PettyCashController::class, 'storeCategory'])->name('pettycash.categories.store');
            Route::put('pettycash/categories/{category}', [PettyCashController::class, 'updateCategory'])->name('pettycash.categories.update');
            Route::delete('pettycash/categories/{category}', [PettyCashController::class, 'destroyCategory'])->name('pettycash.categories.destroy');
        });

        // Customers routes
        Route::middleware('permission:manage-customers')->group(function () {
            Route::get('customers', [CustomerController::class, 'index'])->middleware('permission:manage-customers')->name('customers.index');
            Route::get('customers/create', [CustomerController::class, 'create'])->middleware('permission:create-customers')->name('customers.create');
            Route::post('customers/quick', [CustomerController::class, 'quickStore'])->middleware('permission:create-customers')->name('customers.quick-store');
            Route::get('customers/{customer}', [CustomerController::class, 'show'])->middleware('permission:view-customers')->name('customers.show');
            Route::get('customers/{customer}/edit', [CustomerController::class, 'edit'])->middleware('permission:edit-customers')->name('customers.edit');
            Route::post('customers', [CustomerController::class, 'store'])->middleware('permission:create-customers')->name('customers.store');
            Route::put('customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:edit-customers')->name('customers.update');
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->middleware('permission:delete-customers')->name('customers.destroy');
        });

        // Delivery Routes routes
        Route::middleware('permission:manage-delivery-routes')->group(function () {
            Route::get('delivery-routes', [DeliveryRouteController::class, 'index'])->middleware('permission:manage-delivery-routes')->name('delivery-routes.index');
            Route::post('delivery-routes', [DeliveryRouteController::class, 'store'])->middleware('permission:create-delivery-routes')->name('delivery-routes.store');
            Route::put('delivery-routes/{deliveryRoute}', [DeliveryRouteController::class, 'update'])->middleware('permission:edit-delivery-routes')->name('delivery-routes.update');
            Route::delete('delivery-routes/{deliveryRoute}', [DeliveryRouteController::class, 'destroy'])->middleware('permission:delete-delivery-routes')->name('delivery-routes.destroy');
            Route::put('delivery-routes/{deliveryRoute}/toggle-status', [DeliveryRouteController::class, 'toggleStatus'])->middleware('permission:toggle-status-delivery-routes')->name('delivery-routes.toggle-status');
        });

        // Suppliers routes
        Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::get('suppliers/create', [SupplierController::class, 'create'])->name('suppliers.create');
        Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->name('suppliers.show');
        Route::get('suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('suppliers.edit');
        Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

        // Reports routes
        Route::middleware('permission:manage-reports')->group(function () {
            Route::get('reports/leads', [ReportsController::class, 'leads'])->name('reports.leads');
            Route::get('reports/sales', [ReportsController::class, 'sales'])->name('reports.sales');
            Route::get('reports/product-reports', [ReportsController::class, 'products'])->name('reports.product-reports');
            Route::get('reports/customers', [ReportsController::class, 'customers'])->name('reports.customers');
            Route::get('reports/customer-outstanding', [ReportsController::class, 'customerOutstanding'])->name('reports.customer-outstanding');
            Route::get('reports/projects', [ReportsController::class, 'projects'])->name('reports.projects');
            Route::get('reports/supplier-product', [ReportsController::class, 'supplierProductReport'])->name('reports.supplier-product');
            Route::get('reports/reorder-level', [ReportsController::class, 'reorderLevelReport'])->name('reports.reorder-level');
            Route::get('reports/fast-slow-moving', [ReportsController::class, 'fastSlowMovingReport'])->name('reports.fast-slow-moving');
        });

        Route::get('reports/customer-details', [CustomerDetailsReportController::class, 'index'])
            ->middleware('permission:manage-reports|view-customer-details-report')
            ->name('reports.customer-details');

        Route::get('reports/supplier-details', [SupplierDetailsReportController::class, 'index'])
            ->middleware('permission:manage-reports|view-supplier-details-report')
            ->name('reports.supplier-details');

        Route::get('reports/supplier-ledger-card', [SupplierLedgerCardController::class, 'index'])
            ->middleware('permission:manage-reports|view-supplier-ledger-card')
            ->name('reports.supplier-ledger-card');

        Route::get('reports/customer-ledger-card', [CustomerLedgerCardController::class, 'index'])
            ->middleware('permission:manage-reports|view-customer-ledger-card')
            ->name('reports.customer-ledger-card');

        Route::get('reports/sales-report', [SalesReportController::class, 'index'])
            ->middleware('permission:manage-reports|view-sales-reports')
            ->name('reports.sales-report');

        Route::get('reports/price-details', [PriceDetailsReportController::class, 'index'])
            ->middleware('permission:manage-reports|view-price-details-report')
            ->name('reports.price-details');

        Route::get('reports/cash-collection', [CashCollectionReportController::class, 'index'])
            ->middleware('permission:manage-reports|view-cash-collection-report')
            ->name('reports.cash-collection');

        Route::get('reports/approved-stock-transfers', [ApprovedStockTransferReportController::class, 'index'])
            ->middleware('permission:manage-reports')
            ->name('reports.approved-stock-transfers');

        // Account Types routes
        Route::middleware('permission:manage-account-types')->group(function () {
            Route::get('account-types', [AccountTypeController::class, 'index'])->middleware('permission:manage-account-types')->name('account-types.index');
            Route::post('account-types', [AccountTypeController::class, 'store'])->middleware('permission:create-account-types')->name('account-types.store');
            Route::put('account-types/{accountType}', [AccountTypeController::class, 'update'])->middleware('permission:edit-account-types')->name('account-types.update');
            Route::delete('account-types/{accountType}', [AccountTypeController::class, 'destroy'])->middleware('permission:delete-account-types')->name('account-types.destroy');
            Route::put('account-types/{accountType}/toggle-status', [AccountTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-account-types')->name('account-types.toggle-status');
        });

        // Account Industries routes
        Route::middleware('permission:manage-account-industries')->group(function () {
            Route::get('account-industries', [AccountIndustryController::class, 'index'])->middleware('permission:manage-account-industries')->name('account-industries.index');
            Route::post('account-industries', [AccountIndustryController::class, 'store'])->middleware('permission:create-account-industries')->name('account-industries.store');
            Route::put('account-industries/{accountIndustry}', [AccountIndustryController::class, 'update'])->middleware('permission:edit-account-industries')->name('account-industries.update');
            Route::delete('account-industries/{accountIndustry}', [AccountIndustryController::class, 'destroy'])->middleware('permission:delete-account-industries')->name('account-industries.destroy');
            Route::put('account-industries/{accountIndustry}/toggle-status', [AccountIndustryController::class, 'toggleStatus'])->middleware('permission:toggle-status-account-industries')->name('account-industries.toggle-status');
        });

        // Accounts routes
        Route::middleware('permission:manage-accounts')->group(function () {
            Route::get('accounts', [AccountController::class, 'index'])->middleware('permission:manage-accounts')->name('accounts.index');
            Route::get('accounts/{account}', [AccountController::class, 'show'])->middleware('permission:view-accounts')->name('accounts.show');
            Route::post('accounts', [AccountController::class, 'store'])->middleware('permission:create-accounts')->name('accounts.store');
            Route::put('accounts/{account}', [AccountController::class, 'update'])->middleware('permission:edit-accounts')->name('accounts.update');
            Route::delete('accounts/{account}', [AccountController::class, 'destroy'])->middleware('permission:delete-accounts')->name('accounts.destroy');
            Route::put('accounts/{account}/toggle-status', [AccountController::class, 'toggleStatus'])->middleware('permission:toggle-status-accounts')->name('accounts.toggle-status');
            Route::delete('accounts/{account}/activities', [AccountController::class, 'deleteActivities'])->middleware('permission:delete-accounts')->name('accounts.delete-activities');
            Route::delete('accounts/{account}/activities/{activity}', [AccountController::class, 'deleteActivity'])->middleware('permission:delete-accounts')->name('accounts.delete-activity');

            // Account Comments routes
            Route::post('accounts/{account}/comments', [AccountCommentController::class, 'store'])->middleware('permission:create-accounts')->name('accounts.comments.store');
            Route::put('accounts/{account}/activities/{activity}/comment', [AccountCommentController::class, 'updateActivity'])->middleware('permission:edit-accounts')->name('accounts.comments.update-activity');
        });

        // Contacts routes
        Route::middleware('permission:manage-contacts')->group(function () {
            Route::get('contacts', [ContactController::class, 'index'])->middleware('permission:manage-contacts')->name('contacts.index');
            Route::get('contacts/{contact}', [ContactController::class, 'show'])->middleware('permission:view-contacts')->name('contacts.show');
            Route::post('contacts', [ContactController::class, 'store'])->middleware('permission:create-contacts')->name('contacts.store');
            Route::put('contacts/{contact}', [ContactController::class, 'update'])->middleware('permission:edit-contacts')->name('contacts.update');
            Route::delete('contacts/{contact}', [ContactController::class, 'destroy'])->middleware('permission:delete-contacts')->name('contacts.destroy');
            Route::put('contacts/{contact}/toggle-status', [ContactController::class, 'toggleStatus'])->middleware('permission:toggle-status-contacts')->name('contacts.toggle-status');
        });

        // Lead Status routes
        Route::middleware('permission:manage-lead-statuses')->group(function () {
            Route::get('lead-statuses', [LeadStatusController::class, 'index'])->middleware('permission:manage-lead-statuses')->name('lead-statuses.index');
            Route::post('lead-statuses', [LeadStatusController::class, 'store'])->middleware('permission:create-lead-statuses')->name('lead-statuses.store');
            Route::put('lead-statuses/{leadStatus}', [LeadStatusController::class, 'update'])->middleware('permission:edit-lead-statuses')->name('lead-statuses.update');
            Route::delete('lead-statuses/{leadStatus}', [LeadStatusController::class, 'destroy'])->middleware('permission:delete-lead-statuses')->name('lead-statuses.destroy');
            Route::put('lead-statuses/{leadStatus}/toggle-status', [LeadStatusController::class, 'toggleStatus'])->middleware('permission:toggle-status-lead-statuses')->name('lead-statuses.toggle-status');
        });

        // Lead Source routes
        Route::middleware('permission:manage-lead-sources')->group(function () {
            Route::get('lead-sources', [LeadSourceController::class, 'index'])->middleware('permission:manage-lead-sources')->name('lead-sources.index');
            Route::post('lead-sources', [LeadSourceController::class, 'store'])->middleware('permission:create-lead-sources')->name('lead-sources.store');
            Route::put('lead-sources/{leadSource}', [LeadSourceController::class, 'update'])->middleware('permission:edit-lead-sources')->name('lead-sources.update');
            Route::delete('lead-sources/{leadSource}', [LeadSourceController::class, 'destroy'])->middleware('permission:delete-lead-sources')->name('lead-sources.destroy');
            Route::put('lead-sources/{leadSource}/toggle-status', [LeadSourceController::class, 'toggleStatus'])->middleware('permission:toggle-status-lead-sources')->name('lead-sources.toggle-status');
        });

        // Lead routes
        Route::middleware('permission:manage-leads')->group(function () {
            Route::get('leads', [LeadController::class, 'index'])->middleware('permission:manage-leads')->name('leads.index');
            Route::get('leads/{lead}', [LeadController::class, 'show'])->middleware('permission:view-leads')->name('leads.show');
            Route::post('leads', [LeadController::class, 'store'])->middleware('permission:create-leads')->name('leads.store');
            Route::put('leads/{lead}', [LeadController::class, 'update'])->middleware('permission:edit-leads')->name('leads.update');
            Route::delete('leads/{lead}', [LeadController::class, 'destroy'])->middleware('permission:delete-leads')->name('leads.destroy');
            Route::put('leads/{lead}/toggle-status', [LeadController::class, 'toggleStatus'])->middleware('permission:toggle-status-leads')->name('leads.toggle-status');
            Route::put('leads/{lead}/convert-to-account', [LeadController::class, 'convertToAccount'])->middleware('permission:convert-leads')->name('leads.convert-to-account');
            // Route::post('leads/{lead}/convert-to-account', [LeadController::class, 'convertToAccount'])->middleware('permission:convert-leads')->name('leads.convert-to-account');
            // Route::post('leads/{lead}/convert-to-contact', [LeadController::class, 'convertToContact'])->middleware('permission:convert-leads')->name('leads.convert-to-contact');
            Route::put('leads/{lead}/convert-to-contact', [LeadController::class, 'convertToContact'])->middleware('permission:convert-leads')->name('leads.convert-to-contact');

            Route::post('leads/{lead}/update-field', [LeadController::class, 'updateField'])->middleware('permission:edit-leads')->name('leads.update-field');
            Route::put('leads/{lead}/update-status', [LeadController::class, 'updateStatus'])->middleware('permission:edit-leads')->name('leads.update-status');
            Route::delete('leads/{lead}/activities', [LeadController::class, 'deleteActivities'])->middleware('permission:delete-leads')->name('leads.delete-activities');
            Route::delete('leads/{lead}/activities/{activity}', [LeadController::class, 'deleteActivity'])->middleware('permission:delete-leads')->name('leads.delete-activity');

            // Lead Comments routes
            Route::post('leads/{lead}/comments', [LeadCommentController::class, 'store'])->middleware('permission:create-leads')->name('leads.comments.store');
            Route::put('leads/{lead}/comments/{comment}', [LeadCommentController::class, 'update'])->middleware('permission:edit-leads')->name('leads.comments.update');
            Route::put('leads/{lead}/activities/{activity}/comment', [LeadCommentController::class, 'updateActivity'])->middleware('permission:edit-leads')->name('leads.comments.update-activity');
            Route::delete('leads/{lead}/comments/{comment}', [LeadCommentController::class, 'destroy'])->middleware('permission:delete-leads')->name('leads.comments.destroy');
        });

        // Opportunity Stage routes
        Route::middleware('permission:manage-opportunity-stages')->group(function () {
            Route::get('opportunity-stages', [OpportunityStageController::class, 'index'])->middleware('permission:manage-opportunity-stages')->name('opportunity-stages.index');
            Route::post('opportunity-stages', [OpportunityStageController::class, 'store'])->middleware('permission:create-opportunity-stages')->name('opportunity-stages.store');
            Route::put('opportunity-stages/{opportunityStage}', [OpportunityStageController::class, 'update'])->middleware('permission:edit-opportunity-stages')->name('opportunity-stages.update');
            Route::delete('opportunity-stages/{opportunityStage}', [OpportunityStageController::class, 'destroy'])->middleware('permission:delete-opportunity-stages')->name('opportunity-stages.destroy');
            Route::put('opportunity-stages/{opportunityStage}/toggle-status', [OpportunityStageController::class, 'toggleStatus'])->middleware('permission:toggle-status-opportunity-stages')->name('opportunity-stages.toggle-status');
        });

        // Opportunity Source routes
        Route::middleware('permission:manage-opportunity-sources')->group(function () {
            Route::get('opportunity-sources', [OpportunitySourceController::class, 'index'])->middleware('permission:manage-opportunity-sources')->name('opportunity-sources.index');
            Route::post('opportunity-sources', [OpportunitySourceController::class, 'store'])->middleware('permission:create-opportunity-sources')->name('opportunity-sources.store');
            Route::put('opportunity-sources/{opportunitySource}', [OpportunitySourceController::class, 'update'])->middleware('permission:edit-opportunity-sources')->name('opportunity-sources.update');
            Route::delete('opportunity-sources/{opportunitySource}', [OpportunitySourceController::class, 'destroy'])->middleware('permission:delete-opportunity-sources')->name('opportunity-sources.destroy');
            Route::put('opportunity-sources/{opportunitySource}/toggle-status', [OpportunitySourceController::class, 'toggleStatus'])->middleware('permission:toggle-status-opportunity-sources')->name('opportunity-sources.toggle-status');
        });

        // Opportunity routes
        // Route::middleware('permission:manage-opportunities')->group(function () {
        //     Route::get('opportunities', [OpportunityController::class, 'index'])->middleware('permission:manage-opportunities')->name('opportunities.index');
        //     Route::get('opportunities/{opportunity}', [OpportunityController::class, 'show'])->middleware('permission:view-opportunities')->name('opportunities.show');
        //     Route::post('opportunities', [OpportunityController::class, 'store'])->middleware('permission:create-opportunities')->name('opportunities.store');
        //     Route::put('opportunities/{opportunity}', [OpportunityController::class, 'update'])->middleware('permission:edit-opportunities')->name('opportunities.update');
        //     Route::delete('opportunities/{opportunity}', [OpportunityController::class, 'destroy'])->middleware('permission:delete-opportunities')->name('opportunities.destroy');
        //     Route::put('opportunities/{opportunity}/toggle-status', [OpportunityController::class, 'toggleStatus'])->middleware('permission:toggle-status-opportunities')->name('opportunities.toggle-status');
        //     Route::put('opportunities/{opportunity}/update-status', [OpportunityController::class, 'updateStatus'])->middleware('permission:edit-opportunities')->name('opportunities.update-status');
        //     Route::delete('opportunities/{opportunity}/activities', [OpportunityController::class, 'deleteActivities'])->middleware('permission:delete-opportunities')->name('opportunities.delete-activities');
        //     Route::delete('opportunities/{opportunity}/activities/{activity}', [OpportunityController::class, 'deleteActivity'])->middleware('permission:delete-opportunities')->name('opportunities.delete-activity');

        //     // Opportunity Comments routes
        //     Route::post('opportunities/{opportunity}/comments', [OpportunityCommentController::class, 'store'])->middleware('permission:create-opportunities')->name('opportunities.comments.store');
        //     Route::put('opportunities/{opportunity}/activities/{activity}/comment', [OpportunityCommentController::class, 'updateActivity'])->middleware('permission:edit-opportunities')->name('opportunities.comments.update-activity');
        // });

        // Campaign Type routes
        // Route::middleware('permission:manage-campaign-types')->group(function () {
        //     Route::get('campaign-types', [CampaignTypeController::class, 'index'])->middleware('permission:manage-campaign-types')->name('campaign-types.index');
        //     Route::post('campaign-types', [CampaignTypeController::class, 'store'])->middleware('permission:create-campaign-types')->name('campaign-types.store');
        //     Route::put('campaign-types/{campaignType}', [CampaignTypeController::class, 'update'])->middleware('permission:edit-campaign-types')->name('campaign-types.update');
        //     Route::delete('campaign-types/{campaignType}', [CampaignTypeController::class, 'destroy'])->middleware('permission:delete-campaign-types')->name('campaign-types.destroy');
        //     Route::put('campaign-types/{campaignType}/toggle-status', [CampaignTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-campaign-types')->name('campaign-types.toggle-status');
        // });

        // Target List routes
        // Route::middleware('permission:manage-target-lists')->group(function () {
        //     Route::get('target-lists', [TargetListController::class, 'index'])->middleware('permission:manage-target-lists')->name('target-lists.index');
        //     Route::post('target-lists', [TargetListController::class, 'store'])->middleware('permission:create-target-lists')->name('target-lists.store');
        //     Route::put('target-lists/{targetList}', [TargetListController::class, 'update'])->middleware('permission:edit-target-lists')->name('target-lists.update');
        //     Route::delete('target-lists/{targetList}', [TargetListController::class, 'destroy'])->middleware('permission:delete-target-lists')->name('target-lists.destroy');
        //     Route::put('target-lists/{targetList}/toggle-status', [TargetListController::class, 'toggleStatus'])->middleware('permission:toggle-status-target-lists')->name('target-lists.toggle-status');
        // });

        // Campaign routes
        // Route::middleware('permission:manage-campaigns')->group(function () {
        //     Route::get('campaigns', [CampaignController::class, 'index'])->middleware('permission:manage-campaigns')->name('campaigns.index');
        //     Route::post('campaigns', [CampaignController::class, 'store'])->middleware('permission:create-campaigns')->name('campaigns.store');
        //     Route::put('campaigns/{campaign}', [CampaignController::class, 'update'])->middleware('permission:edit-campaigns')->name('campaigns.update');
        //     Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->middleware('permission:delete-campaigns')->name('campaigns.destroy');
        //     Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->middleware('permission:view-campaigns')->name('campaigns.show');
        //     Route::put('campaigns/{campaign}/toggle-status', [CampaignController::class, 'toggleStatus'])->middleware('permission:toggle-status-campaigns')->name('campaigns.toggle-status');
        // });

        // Shipping Provider Type routes
        // Route::middleware('permission:manage-shipping-provider-types')->group(function () {
        //     Route::get('shipping-provider-types', [ShippingProviderTypeController::class, 'index'])->middleware('permission:manage-shipping-provider-types')->name('shipping-provider-types.index');
        //     Route::get('shipping-provider-types/{id}', [ShippingProviderTypeController::class, 'show'])->middleware('permission:view-shipping-provider-types')->name('shipping-provider-types.show');
        //     Route::post('shipping-provider-types', [ShippingProviderTypeController::class, 'store'])->middleware('permission:create-shipping-provider-types')->name('shipping-provider-types.store');
        //     Route::put('shipping-provider-types/{shippingProviderType}', [ShippingProviderTypeController::class, 'update'])->middleware('permission:edit-shipping-provider-types')->name('shipping-provider-types.update');
        //     Route::delete('shipping-provider-types/{shippingProviderType}', [ShippingProviderTypeController::class, 'destroy'])->middleware('permission:delete-shipping-provider-types')->name('shipping-provider-types.destroy');
        //     Route::put('shipping-provider-types/{shippingProviderType}/toggle-status', [ShippingProviderTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-shipping-provider-types')->name('shipping-provider-types.toggle-status');
        // });

        // Cases routes
        // Route::middleware('permission:manage-cases')->group(function () {
        //     Route::get('cases', [CaseController::class, 'index'])->middleware('permission:manage-cases')->name('cases.index');
        //     Route::get('cases/create', [CaseController::class, 'create'])->middleware('permission:create-cases')->name('cases.create');
        //     Route::get('cases/{case}', [CaseController::class, 'show'])->middleware('permission:view-cases')->name('cases.show');
        //     Route::get('cases/{case}/edit', [CaseController::class, 'edit'])->middleware('permission:edit-cases')->name('cases.edit');
        //     Route::post('cases', [CaseController::class, 'store'])->middleware('permission:create-cases')->name('cases.store');
        //     Route::put('cases/{case}', [CaseController::class, 'update'])->middleware('permission:edit-cases')->name('cases.update');
        //     Route::delete('cases/{case}', [CaseController::class, 'destroy'])->middleware('permission:delete-cases')->name('cases.destroy');
        //     Route::put('cases/{case}/toggle-status', [CaseController::class, 'toggleStatus'])->middleware('permission:toggle-status-cases')->name('cases.toggle-status');
        // });

        // Quote routes
        // Route::middleware('permission:manage-quotes')->group(function () {
        //     Route::get('quotes', [QuoteController::class, 'index'])->middleware('permission:manage-quotes')->name('quotes.index');
        //     Route::get('quotes/{quote}', [QuoteController::class, 'show'])->middleware('permission:view-quotes')->name('quotes.show');
        //     Route::post('quotes', [QuoteController::class, 'store'])->middleware('permission:create-quotes')->name('quotes.store');
        //     Route::put('quotes/{quote}', [QuoteController::class, 'update'])->middleware('permission:edit-quotes')->name('quotes.update');
        //     Route::delete('quotes/{quote}', [QuoteController::class, 'destroy'])->middleware('permission:delete-quotes')->name('quotes.destroy');
        //     Route::put('quotes/{quote}/toggle-status', [QuoteController::class, 'toggleStatus'])->middleware('permission:toggle-status-quotes')->name('quotes.toggle-status');
        //     Route::put('quotes/{quote}/assign-user', [QuoteController::class, 'assignUser'])->middleware('permission:edit-quotes')->name('quotes.assign-user');
        //     Route::put('quotes/{quote}/add-opportunity', [QuoteController::class, 'addOpportunity'])->middleware('permission:edit-quotes')->name('quotes.add-opportunity');

        //     // Quote Comments routes
        //     Route::post('quotes/{quote}/comments', [QuoteCommentController::class, 'store'])->middleware('permission:create-quotes')->name('quotes.comments.store');
        //     Route::put('quotes/{quote}/activities/{activity}/comment', [QuoteCommentController::class, 'updateActivity'])->middleware('permission:edit-quotes')->name('quotes.comments.update-activity');

        //     // Quote Activity delete routes
        //     Route::delete('quotes/{quote}/activities', [QuoteController::class, 'deleteActivities'])->middleware('permission:delete-quotes')->name('quotes.delete-activities');
        //     Route::delete('quotes/{quote}/activities/{activity}', [QuoteController::class, 'deleteActivity'])->middleware('permission:delete-quotes')->name('quotes.delete-activity');
        //     Route::get('api/opportunities/{opportunity}/details', [QuoteController::class, 'getOpportunityDetails'])->name('api.opportunities.details');
        // });

        // Sales Order routes
        // Route::middleware('permission:manage-sales-orders')->group(function () {
        //     Route::get('sales-orders', [SalesOrderController::class, 'index'])->middleware('permission:manage-sales-orders')->name('sales-orders.index');
        //     Route::get('sales-orders/{salesOrder}', [SalesOrderController::class, 'show'])->middleware('permission:view-sales-orders')->name('sales-orders.show');
        //     Route::post('sales-orders', [SalesOrderController::class, 'store'])->middleware('permission:create-sales-orders')->name('sales-orders.store');
        //     Route::put('sales-orders/{salesOrder}', [SalesOrderController::class, 'update'])->middleware('permission:edit-sales-orders')->name('sales-orders.update');
        //     Route::delete('sales-orders/{salesOrder}', [SalesOrderController::class, 'destroy'])->middleware('permission:delete-sales-orders')->name('sales-orders.destroy');
        //     Route::put('sales-orders/{salesOrder}/toggle-status', [SalesOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-sales-orders')->name('sales-orders.toggle-status');

        //     Route::put('sales-orders/{salesOrder}/assign-user', [SalesOrderController::class, 'assignUser'])->middleware('permission:edit-sales-orders')->name('sales-orders.assign-user');

        //     // Sales Order Comments routes
        //     Route::post('sales-orders/{salesOrder}/comments', [SalesOrderCommentController::class, 'store'])->middleware('permission:create-sales-orders')->name('sales-orders.comments.store');
        //     Route::put('sales-orders/{salesOrder}/activities/{activity}/comment', [SalesOrderCommentController::class, 'updateActivity'])->middleware('permission:edit-sales-orders')->name('sales-orders.comments.update-activity');

        //     // Sales Order Activity delete routes
        //     Route::delete('sales-orders/{salesOrder}/activities', [SalesOrderController::class, 'deleteActivities'])->middleware('permission:delete-sales-orders')->name('sales-orders.delete-activities');
        //     Route::delete('sales-orders/{salesOrder}/activities/{activity}', [SalesOrderController::class, 'deleteActivity'])->middleware('permission:delete-sales-orders')->name('sales-orders.delete-activity');
        //     Route::get('api/quotes/{quote}/details', [SalesOrderController::class, 'getQuoteDetails'])->name('api.quotes.details');
        //     Route::get('api/sales-orders/{salesOrder}/details', [PurchaseOrderController::class, 'getSalesOrderDetails'])->name('api.sales-orders.details');
        //     Route::get('api/invoices/sales-orders/{salesOrder}/details', [InvoiceController::class, 'getSalesOrderDetails'])->name('api.invoices.sales-orders.details');
        //     Route::get('api/invoices/quotes/{quote}/details', [InvoiceController::class, 'getQuoteDetails'])->name('api.invoices.quotes.details');
        //     Route::get('api/invoices/opportunities/{opportunity}/details', [InvoiceController::class, 'getOpportunityDetails'])->name('api.invoices.opportunities.details');

        //     Route::get('api/return-orders/sales-orders/{salesOrder}/details', [ReturnOrderController::class, 'getSalesOrderDetails'])->name('api.return-orders.sales-orders.details');

        //     Route::get('api/receipt-orders/purchase-orders/{purchaseOrder}/details', [ReceiptOrderController::class, 'getPurchaseOrderDetails'])->name('api.receipt-orders.purchase-orders.details');
        //     Route::get('api/receipt-orders/return-orders/{returnOrder}/details', [ReceiptOrderController::class, 'getReturnOrderDetails'])->name('api.receipt-orders.return-orders.details');

        //     // Invoice routes
        //     Route::middleware('permission:manage-invoices')->group(function () {
        //         Route::get('invoices', [InvoiceController::class, 'index'])->middleware('permission:manage-invoices')->name('invoices.index');
        //         Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:view-invoices')->name('invoices.show');
        //         Route::post('invoices', [InvoiceController::class, 'store'])->middleware('permission:create-invoices')->name('invoices.store');
        //         Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:edit-invoices')->name('invoices.update');
        //         Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:delete-invoices')->name('invoices.destroy');
        //         Route::put('invoices/{invoice}/toggle-status', [InvoiceController::class, 'toggleStatus'])->middleware('permission:toggle-status-invoices')->name('invoices.toggle-status');

        //         Route::put('invoices/{invoice}/assign-user', [InvoiceController::class, 'assignUser'])->middleware('permission:edit-invoices')->name('invoices.assign-user');

        //         // Invoice Comments routes
        //         Route::post('invoices/{invoice}/comments', [InvoiceCommentController::class, 'store'])->middleware('permission:create-invoices')->name('invoices.comments.store');
        //         Route::put('invoices/{invoice}/activities/{activity}/comment', [InvoiceCommentController::class, 'updateActivity'])->middleware('permission:edit-invoices')->name('invoices.comments.update-activity');

        //         // Invoice Activity delete routes
        //         Route::delete('invoices/{invoice}/activities', [InvoiceController::class, 'deleteActivities'])->middleware('permission:delete-invoices')->name('invoices.delete-activities');
        //         Route::delete('invoices/{invoice}/activities/{activity}', [InvoiceController::class, 'deleteActivity'])->middleware('permission:delete-invoices')->name('invoices.delete-activity');
        //     });

        // Delivery Order routes
        Route::middleware('permission:manage-delivery-orders')->group(function () {
            Route::get('delivery-orders', [DeliveryOrderController::class, 'index'])->middleware('permission:manage-delivery-orders')->name('delivery-orders.index');
            Route::get('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'show'])->middleware('permission:view-delivery-orders')->name('delivery-orders.show');
            Route::post('delivery-orders', [DeliveryOrderController::class, 'store'])->middleware('permission:create-delivery-orders')->name('delivery-orders.store');
            Route::put('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'update'])->middleware('permission:edit-delivery-orders')->name('delivery-orders.update');
            Route::delete('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'destroy'])->middleware('permission:delete-delivery-orders')->name('delivery-orders.destroy');
            Route::put('delivery-orders/{deliveryOrder}/toggle-status', [DeliveryOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-delivery-orders')->name('delivery-orders.toggle-status');

            Route::put('delivery-orders/{deliveryOrder}/assign-user', [DeliveryOrderController::class, 'assignUser'])->middleware('permission:edit-delivery-orders')->name('delivery-orders.assign-user');
        });

        // Delivery Route routes
        Route::middleware('permission:manage-delivery-routes')->group(function () {
            Route::get('delivery-routes', [DeliveryRouteController::class, 'index'])->middleware('permission:manage-delivery-routes')->name('delivery-routes.index');
            Route::get('delivery-routes/create', [DeliveryRouteController::class, 'create'])->middleware('permission:create-delivery-routes')->name('delivery-routes.create');
            Route::get('delivery-routes/{deliveryRoute}', [DeliveryRouteController::class, 'show'])->middleware('permission:view-delivery-routes')->name('delivery-routes.show');
            Route::get('delivery-routes/{deliveryRoute}/edit', [DeliveryRouteController::class, 'edit'])->middleware('permission:edit-delivery-routes')->name('delivery-routes.edit');
            Route::post('delivery-routes', [DeliveryRouteController::class, 'store'])->middleware('permission:create-delivery-routes')->name('delivery-routes.store');
            Route::put('delivery-routes/{deliveryRoute}', [DeliveryRouteController::class, 'update'])->middleware('permission:edit-delivery-routes')->name('delivery-routes.update');
            Route::delete('delivery-routes/{deliveryRoute}', [DeliveryRouteController::class, 'destroy'])->middleware('permission:delete-delivery-routes')->name('delivery-routes.destroy');
        });

        //     // Return Order routes
        //     Route::middleware('permission:manage-delivery-orders')->group(function () {
        //         Route::get('return-orders', [ReturnOrderController::class, 'index'])->middleware('permission:manage-delivery-orders')->name('return-orders.index');
        //         Route::get('return-orders/{returnOrder}', [ReturnOrderController::class, 'show'])->middleware('permission:view-return-orders')->name('return-orders.show');
        //         Route::post('return-orders', [ReturnOrderController::class, 'store'])->middleware('permission:create-return-orders')->name('return-orders.store');
        //         Route::put('return-orders/{returnOrder}', [ReturnOrderController::class, 'update'])->middleware('permission:edit-return-orders')->name('return-orders.update');
        //         Route::delete('return-orders/{returnOrder}', [ReturnOrderController::class, 'destroy'])->middleware('permission:delete-return-orders')->name('return-orders.destroy');
        //     });

        // Purchase Order routes
        Route::middleware('permission:manage-purchase-orders')->group(function () {
            Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->middleware('permission:manage-purchase-orders')->name('purchase-orders.index');
            Route::get('purchase-orders/recommend-suppliers', [PurchaseOrderController::class, 'recommendSuppliers'])->middleware('permission:manage-purchase-orders')->name('purchase-orders.recommend-suppliers');
            Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->middleware('permission:view-purchase-orders')->name('purchase-orders.show');
            Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:create-purchase-orders')->name('purchase-orders.store');
            Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.update');
            Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:delete-purchase-orders')->name('purchase-orders.destroy');
            Route::put('purchase-orders/{purchaseOrder}/toggle-status', [PurchaseOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-purchase-orders')->name('purchase-orders.toggle-status');
            Route::put('purchase-orders/{purchaseOrder}/add-sales-order', [PurchaseOrderController::class, 'addSalesOrder'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.add-sales-order');
            Route::put('purchase-orders/{purchaseOrder}/assign-user', [PurchaseOrderController::class, 'assignUser'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.assign-user');
            Route::post('purchase-orders/{purchaseOrder}/comments', [PurchaseOrderCommentController::class, 'store'])->middleware('permission:create-purchase-orders')->name('purchase-orders.comments.store');
            Route::put('purchase-orders/{purchaseOrder}/activities/{activity}/comment', [PurchaseOrderCommentController::class, 'updateActivity'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.comments.update-activity');
            Route::delete('purchase-orders/{purchaseOrder}/activities', [PurchaseOrderController::class, 'deleteActivities'])->middleware('permission:delete-purchase-orders')->name('purchase-orders.delete-activities');
            Route::delete('purchase-orders/{purchaseOrder}/activities/{activity}', [PurchaseOrderController::class, 'deleteActivity'])->middleware('permission:delete-purchase-orders')->name('purchase-orders.delete-activity');
        });

        // });

        // GRN routes (no permission checks - open to all authenticated users)
        Route::get('grns', [\App\Http\Controllers\GrnController::class, 'index'])->name('grns.index');
        Route::get('grns/create', [\App\Http\Controllers\GrnController::class, 'create'])->name('grns.create');
        Route::get('grns/create/from-po/{purchaseOrder}', [\App\Http\Controllers\GrnController::class, 'createFromPo'])->name('grns.create-from-po');
        Route::get('grns/next-number', [\App\Http\Controllers\GrnController::class, 'nextNumber'])->name('grns.next-number');
        Route::post('grns', [\App\Http\Controllers\GrnController::class, 'store'])->name('grns.store');
        Route::get('grns/{grn}', [\App\Http\Controllers\GrnController::class, 'show'])->name('grns.show');
        Route::get('grns/{grn}/edit', [\App\Http\Controllers\GrnController::class, 'edit'])->name('grns.edit');
        Route::put('grns/{grn}', [\App\Http\Controllers\GrnController::class, 'update'])->name('grns.update');
        Route::delete('grns/{grn}', [\App\Http\Controllers\GrnController::class, 'destroy'])->name('grns.destroy');

        // Sales routes
        Route::middleware('permission:manage-sales|view-sales')->group(function () {
            Route::get('sales', [SalesTransactionController::class, 'index'])->name('sales.index');
            Route::get('sales/create', [SalesTransactionController::class, 'create'])->middleware('permission:manage-sales|create-sales')->name('sales.create');
            Route::get('sales/next-number', [SalesTransactionController::class, 'nextNumber'])->middleware('permission:manage-sales|create-sales')->name('sales.next-number');
            Route::post('sales', [SalesTransactionController::class, 'store'])->middleware('permission:manage-sales|create-sales')->name('sales.store');
            Route::get('sales/{sales_transaction}', [SalesTransactionController::class, 'show'])->name('sales.show');
            Route::get('sales/{sales_transaction}/edit', [SalesTransactionController::class, 'edit'])->middleware('permission:manage-sales|edit-sales')->name('sales.edit');
            Route::put('sales/{sales_transaction}', [SalesTransactionController::class, 'update'])->middleware('permission:manage-sales|edit-sales')->name('sales.update');
            Route::delete('sales/{sales_transaction}', [SalesTransactionController::class, 'destroy'])->middleware('permission:manage-sales|delete-sales')->name('sales.destroy');
        });

        // Stock In Hand (batch-wise)
        Route::get('stock-in-hand', [StockInHandController::class, 'index'])->name('stock-in-hand.index');
        Route::get('stock-bin-card', [StockBinCardController::class, 'index'])->name('inventory.stock-bin-card');
        Route::get('stock-in-hand/{productId}/{batch}', [StockInHandController::class, 'show'])->where('batch', '[^/]+')->name('stock-in-hand.show');
        Route::get('stock-bin-card/{productId}/{batch}', [StockBinCardController::class, 'show'])->where('batch', '[^/]+')->name('inventory.stock-bin-card.show');

        // Route::middleware('permission:manage-sales-orders')->group(function () {
        //     // Receipt Order routes
        //     Route::get('receipt-orders', [ReceiptOrderController::class, 'index'])->middleware('permission:manage-receipt-orders')->name('receipt-orders.index');
        //     Route::get('receipt-orders/{receiptOrder}', [ReceiptOrderController::class, 'show'])->middleware('permission:view-receipt-orders')->name('receipt-orders.show');
        //     Route::post('receipt-orders', [ReceiptOrderController::class, 'store'])->middleware('permission:create-receipt-orders')->name('receipt-orders.store');
        //     Route::put('receipt-orders/{receiptOrder}', [ReceiptOrderController::class, 'update'])->middleware('permission:edit-receipt-orders')->name('receipt-orders.update');
        //     Route::delete('receipt-orders/{receiptOrder}', [ReceiptOrderController::class, 'destroy'])->middleware('permission:delete-receipt-orders')->name('receipt-orders.destroy');
        //     Route::put('receipt-orders/{receiptOrder}/toggle-status', [ReceiptOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-receipt-orders')->name('receipt-orders.toggle-status');

        //     Route::put('receipt-orders/{receiptOrder}/assign-user', [ReceiptOrderController::class, 'assignUser'])->middleware('permission:edit-receipt-orders')->name('receipt-orders.assign-user');
        // });

        // Project routes
        // Route::middleware('permission:manage-projects')->group(function () {
        //     Route::get('projects', [ProjectController::class, 'index'])->middleware('permission:manage-projects')->name('projects.index');
        //     Route::get('projects/{project}', [ProjectController::class, 'show'])->middleware('permission:view-projects')->name('projects.show');
        //     Route::post('projects', [ProjectController::class, 'store'])->middleware('permission:create-projects')->name('projects.store');
        //     Route::put('projects/{project}', [ProjectController::class, 'update'])->middleware('permission:edit-projects')->name('projects.update');
        //     Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->middleware('permission:delete-projects')->name('projects.destroy');
        //     Route::put('projects/{project}/toggle-status', [ProjectController::class, 'toggleStatus'])->middleware('permission:toggle-status-projects')->name('projects.toggle-status');
        // });

        // Project Task routes
        // Route::middleware('permission:manage-project-tasks')->group(function () {
        //     Route::get('project-tasks', [ProjectTaskController::class, 'index'])->middleware('permission:manage-project-tasks')->name('project-tasks.index');
        //     Route::get('project-tasks/{task}', [ProjectTaskController::class, 'show'])->middleware('permission:view-project-tasks')->name('project-tasks.show');
        //     Route::post('project-tasks', [ProjectTaskController::class, 'store'])->middleware('permission:create-project-tasks')->name('project-tasks.store');
        //     Route::put('project-tasks/{task}', [ProjectTaskController::class, 'update'])->middleware('permission:edit-project-tasks')->name('project-tasks.update');
        //     Route::delete('project-tasks/{task}', [ProjectTaskController::class, 'destroy'])->middleware('permission:delete-project-tasks')->name('project-tasks.destroy');
        //     Route::put('project-tasks/{task}/toggle-status', [ProjectTaskController::class, 'toggleStatus'])->middleware('permission:toggle-status-project-tasks')->name('project-tasks.toggle-status');
        //     Route::get('projects/{project}/kanban', [ProjectTaskController::class, 'kanban'])->middleware('permission:view-project-tasks')->name('projects.kanban');
        //     Route::get('projects/{project}/gantt', [ProjectTaskController::class, 'gantt'])->middleware('permission:view-project-tasks')->name('projects.gantt');
        //     Route::put('project-tasks/{task}/update-status', [ProjectTaskController::class, 'updateStatus'])->middleware('permission:edit-project-tasks')->name('project-tasks.update-status');
        //     Route::get('api/project-tasks/parent-tasks/{projectId}', [ProjectTaskController::class, 'getParentTasks'])->name('api.project-tasks.parent-tasks');
        //     Route::get('api/projects/{projectId}/details', [ProjectTaskController::class, 'getProjectDetails'])->name('api.projects.details');
        // });

        // Task Status routes
        // Route::middleware('permission:manage-task-statuses')->group(function () {
        //     Route::get('task-statuses', [\App\Http\Controllers\TaskStatusController::class, 'index'])->middleware('permission:manage-task-statuses')->name('task-statuses.index');
        //     Route::post('task-statuses', [\App\Http\Controllers\TaskStatusController::class, 'store'])->middleware('permission:create-task-statuses')->name('task-statuses.store');
        //     Route::put('task-statuses/{taskStatus}', [\App\Http\Controllers\TaskStatusController::class, 'update'])->middleware('permission:edit-task-statuses')->name('task-statuses.update');
        //     Route::delete('task-statuses/{taskStatus}', [\App\Http\Controllers\TaskStatusController::class, 'destroy'])->middleware('permission:delete-task-statuses')->name('task-statuses.destroy');
        //     Route::put('task-statuses/{taskStatus}/toggle-status', [\App\Http\Controllers\TaskStatusController::class, 'toggleStatus'])->middleware('permission:toggle-status-task-statuses')->name('task-statuses.toggle-status');
        // });

        // Meeting routes
        // Route::middleware('permission:manage-meetings')->group(function () {
        //     Route::get('meetings', [MeetingController::class, 'index'])->middleware('permission:manage-meetings')->name('meetings.index');
        //     Route::get('meetings/{meeting}', [MeetingController::class, 'show'])->middleware('permission:view-meetings')->name('meetings.show');
        //     Route::post('meetings', [MeetingController::class, 'store'])->middleware('permission:create-meetings')->name('meetings.store');
        //     Route::put('meetings/{meeting}', [MeetingController::class, 'update'])->middleware('permission:edit-meetings')->name('meetings.update');
        //     Route::delete('meetings/{meeting}', [MeetingController::class, 'destroy'])->middleware('permission:delete-meetings')->name('meetings.destroy');
        //     Route::put('meetings/{meeting}/toggle-status', [MeetingController::class, 'toggleStatus'])->middleware('permission:toggle-status-meetings')->name('meetings.toggle-status');
        //     Route::get('api/parent-module/{module}', [MeetingController::class, 'getParentModuleRecords'])->name('api.parent-module.records');
        //     Route::get('api/attendee-types/{type}', [MeetingController::class, 'getAttendeeRecords'])->name('api.attendee-types.records');
        // });

        // Call routes
        // Route::middleware('permission:manage-calls')->group(function () {
        //     Route::get('calls', [CallController::class, 'index'])->middleware('permission:manage-calls')->name('calls.index');
        //     Route::get('calls/{call}', [CallController::class, 'show'])->middleware('permission:view-calls')->name('calls.show');
        //     Route::post('calls', [CallController::class, 'store'])->middleware('permission:create-calls')->name('calls.store');
        //     Route::put('calls/{call}', [CallController::class, 'update'])->middleware('permission:edit-calls')->name('calls.update');
        //     Route::delete('calls/{call}', [CallController::class, 'destroy'])->middleware('permission:delete-calls')->name('calls.destroy');
        //     Route::put('calls/{call}/toggle-status', [CallController::class, 'toggleStatus'])->middleware('permission:toggle-status-calls')->name('calls.toggle-status');
        //     Route::get('api/calls/parent-module/{module}', [CallController::class, 'getParentModuleRecords'])->name('api.calls.parent-module.records');
        //     Route::get('api/calls/attendee-types/{type}', [CallController::class, 'getAttendeeRecords'])->name('api.calls.attendee-types.records');
        // });

        // Calendar route
        Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');

        // Google Calendar API routes
        Route::get('api/google-calendar/events', [\App\Http\Controllers\GoogleCalendarController::class, 'getEvents'])->name('google-calendar.events');
        Route::post('api/google-calendar/sync', [\App\Http\Controllers\GoogleCalendarController::class, 'syncEvents'])->name('google-calendar.sync');
        Route::get('api/google-calendar/status', [\App\Http\Controllers\GoogleCalendarController::class, 'checkStatus'])->name('google-calendar.status');

        // Document Folder management
        // Route::middleware('permission:manage-document-folders')->group(function () {
        //     Route::get('document-folders', [DocumentFolderController::class, 'index'])->middleware('permission:manage-document-folders')->name('document-folders.index');
        //     Route::get('document-folders/{documentFolder}', [DocumentFolderController::class, 'show'])->middleware('permission:view-document-folders')->name('document-folders.show');
        //     Route::post('document-folders', [DocumentFolderController::class, 'store'])->middleware('permission:create-document-folders')->name('document-folders.store');
        //     Route::put('document-folders/{documentFolder}', [DocumentFolderController::class, 'update'])->middleware('permission:edit-document-folders')->name('document-folders.update');
        //     Route::delete('document-folders/{documentFolder}', [DocumentFolderController::class, 'destroy'])->middleware('permission:delete-document-folders')->name('document-folders.destroy');
        //     Route::put('document-folders/{documentFolder}/toggle-status', [DocumentFolderController::class, 'toggleStatus'])->middleware('permission:toggle-status-document-folders')->name('document-folders.toggle-status');
        // });

        // Document Type management
        // Route::middleware('permission:manage-document-types')->group(function () {
        //     Route::get('document-types', [DocumentTypeController::class, 'index'])->middleware('permission:manage-document-types')->name('document-types.index');
        //     Route::get('document-types/{documentType}', [DocumentTypeController::class, 'show'])->middleware('permission:view-document-types')->name('document-types.show');
        //     Route::post('document-types', [DocumentTypeController::class, 'store'])->middleware('permission:create-document-types')->name('document-types.store');
        //     Route::put('document-types/{documentType}', [DocumentTypeController::class, 'update'])->middleware('permission:edit-document-types')->name('document-types.update');
        //     Route::delete('document-types/{documentType}', [DocumentTypeController::class, 'destroy'])->middleware('permission:delete-document-types')->name('document-types.destroy');
        //     Route::put('document-types/{documentType}/toggle-status', [DocumentTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-document-types')->name('document-types.toggle-status');
        // });

        // Document management
        // Route::middleware('permission:manage-documents')->group(function () {
        //     Route::get('documents', [DocumentController::class, 'index'])->middleware('permission:manage-documents')->name('documents.index');
        //     Route::get('documents/{document}', [DocumentController::class, 'show'])->middleware('permission:view-documents')->name('documents.show');
        //     Route::get('documents/{document}/download', [DocumentController::class, 'download'])->middleware('permission:view-documents')->name('documents.download');
        //     Route::post('documents', [DocumentController::class, 'store'])->middleware('permission:create-documents')->name('documents.store');
        //     Route::put('documents/{document}', [DocumentController::class, 'update'])->middleware('permission:edit-documents')->name('documents.update');
        //     Route::delete('documents/{document}', [DocumentController::class, 'destroy'])->middleware('permission:delete-documents')->name('documents.destroy');
        //     Route::put('documents/{document}/toggle-status', [DocumentController::class, 'toggleStatus'])->middleware('permission:toggle-status-documents')->name('documents.toggle-status');
        // });

        // ChatGPT routes
        Route::post('api/chatgpt/generate', [ChatGptController::class, 'generate'])->name('chatgpt.generate');

        // Language management
        Route::get('manage-language/{lang?}', [LanguageController::class, 'managePage'])->middleware('permission:manage-language')->name('manage-language');
        Route::get('language/load', [LanguageController::class, 'load'])->name('language.load');
        Route::match(['POST', 'PATCH'], 'language/save', [LanguageController::class, 'save'])->middleware('permission:edit-language')->name('language.save');
        Route::post('languages/change', [LanguageController::class, 'changeLanguage'])->name('languages.change');
        Route::post('languages/create', [LanguageController::class, 'createLanguage'])->middleware('App\Http\Middleware\SuperAdminMiddleware')->name('languages.create');
        Route::delete('languages/{languageCode}', [LanguageController::class, 'deleteLanguage'])->middleware('App\Http\Middleware\SuperAdminMiddleware')->name('languages.delete');
        Route::patch('languages/{languageCode}/toggle', [LanguageController::class, 'toggleLanguageStatus'])->middleware('App\Http\Middleware\SuperAdminMiddleware')->name('languages.toggle');

        // Landing Page content management (Super Admin only)
        Route::middleware('App\Http\Middleware\SuperAdminMiddleware')->group(function () {
            Route::get('landing-page/settings', [LandingPageController::class, 'settings'])->name('landing-page.settings');
            Route::post('landing-page/settings', [LandingPageController::class, 'updateSettings'])->name('landing-page.settings.update');

            Route::resource('landing-page/custom-pages', CustomPageController::class)->names([
                'index' => 'landing-page.custom-pages.index',
                'store' => 'landing-page.custom-pages.store',
                'update' => 'landing-page.custom-pages.update',
                'destroy' => 'landing-page.custom-pages.destroy',
            ]);

            // Contact Messages routes
            Route::get('contact-messages', [ContactMessageController::class, 'index'])->name('contact-messages.index');
            Route::delete('contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy'])->name('contact-messages.destroy');

            // Newsletter routes
            Route::get('newsletters', [NewsletterController::class, 'index'])->name('newsletters.index');
            Route::delete('newsletters/{newsletter}', [NewsletterController::class, 'destroy'])->name('newsletters.destroy');
        });
    }); // End plan.access middleware group
    // Impersonation routes
    Route::middleware('App\Http\Middleware\SuperAdminMiddleware')->group(function () {
        Route::get('impersonate/{userId}', [ImpersonateController::class, 'start'])->name('impersonate.start');
    });

    Route::post('impersonate/leave', [ImpersonateController::class, 'leave'])->name('impersonate.leave');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Public invoice routes (outside authentication)
Route::get('invoices/public/{invoice}', [InvoiceController::class, 'publicView'])->name('invoices.public');
Route::get('invoice-payment/{method}', [InvoiceController::class, 'showPaymentPage'])->name('invoice.payment.page');

Route::post('invoices/payment/stripe', [InvoiceStripePaymentController::class, 'processPayment'])->name('invoice.stripe.payment');
Route::post('invoices/payment/stripe/confirm', [InvoiceStripePaymentController::class, 'confirmPayment'])->name('invoice.stripe.confirm');
Route::post('invoices/payment/paypal', [InvoicePayPalPaymentController::class, 'processPayment'])->name('invoice.paypal.payment');

Route::post('invoices/payment/bank', [InvoiceBankPaymentController::class, 'processPayment'])->name('invoice.bank.payment');
Route::post('invoices/payment/benefit', [InvoiceBenefitPaymentController::class, 'processPayment'])->name('invoice.benefit.payment');
Route::get('invoices/payment/benefit/success', [InvoiceBenefitPaymentController::class, 'success'])->name('invoice.benefit.success');
Route::post('invoices/payment/benefit/callback', [InvoiceBenefitPaymentController::class, 'callback'])->name('invoice.benefit.callback');

Route::post('invoices/payment/payhere/create-payment', [InvoicePayHerePaymentController::class, 'createPayment'])->name('invoice.payhere.create-payment');
Route::get('invoices/payment/payhere/success', [InvoicePayHerePaymentController::class, 'success'])->name('invoice.payhere.success');
Route::post('invoices/payment/payhere/callback', [InvoicePayHerePaymentController::class, 'callback'])->name('invoice.payhere.callback');

// Invoice payment management routes (authenticated)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('invoices/payments/{paymentId}/approve', [InvoiceController::class, 'approvePayment'])->name('invoice.payments.approve');
    Route::post('invoices/payments/{paymentId}/reject', [InvoiceController::class, 'rejectPayment'])->name('invoice.payments.reject');
});

// Cookie consent routes
Route::post('/cookie-consent/store', [CookieConsentController::class, 'store'])->name('cookie.consent.store');
Route::get('/cookie-consent/download', [CookieConsentController::class, 'download'])->name('cookie.consent.download');

// Invoice template preview route (authenticated)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('invoices/preview/{templateId}/{color}', [InvoiceController::class, 'previewTemplate'])->name('invoice.preview');
});
