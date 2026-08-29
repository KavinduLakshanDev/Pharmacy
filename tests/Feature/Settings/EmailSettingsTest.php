<?php

use App\Mail\TestMail;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

use function Pest\Laravel\actingAs;

test('email settings page is hydrated with saved settings', function () {
    $user = User::factory()->createOne([
        'type' => 'superadmin',
    ]);

    Setting::query()->create([
        'user_id' => $user->id,
        'key' => 'email_driver',
        'value' => 'smtp',
    ]);

    Setting::query()->create([
        'user_id' => $user->id,
        'key' => 'email_host',
        'value' => 'smtp.example.test',
    ]);

    actingAs($user);

    $response = $this->get(route('settings.email'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/components/email-settings')
        ->where('settings.email_driver', 'smtp')
        ->where('settings.email_host', 'smtp.example.test')
    );
});

test('email settings can be updated', function () {
    $user = User::factory()->createOne([
        'type' => 'superadmin',
    ]);

    actingAs($user);

    $response = $this->post(route('settings.email.update'), [
        'provider' => 'smtp',
        'driver' => 'smtp',
        'host' => 'mail.example.test',
        'port' => '2525',
        'username' => 'mailer@example.test',
        'password' => 'secret-password',
        'encryption' => 'tls',
        'fromAddress' => 'noreply@example.test',
        'fromName' => 'Unitec Pharmacy',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('settings', [
        'user_id' => $user->id,
        'key' => 'email_host',
        'value' => 'mail.example.test',
    ]);

    $this->assertDatabaseHas('settings', [
        'user_id' => $user->id,
        'key' => 'email_from_name',
        'value' => 'Unitec Pharmacy',
    ]);
});

test('test email fails fast when smtp settings are placeholders', function () {
    $user = User::factory()->createOne([
        'type' => 'superadmin',
    ]);

    actingAs($user);
    Mail::fake();

    $response = $this->post(route('settings.email.test'), [
        'email' => 'recipient@example.test',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    Mail::assertNothingSent();
});

test('test email can be dispatched with configured smtp settings', function () {
    $user = User::factory()->createOne([
        'type' => 'superadmin',
    ]);

    Setting::query()->create([
        'user_id' => $user->id,
        'key' => 'email_host',
        'value' => 'sandbox.smtp.mailtrap.io',
    ]);

    Setting::query()->create([
        'user_id' => $user->id,
        'key' => 'email_username',
        'value' => 'ac7a5a44287c80',
    ]);

    Setting::query()->create([
        'user_id' => $user->id,
        'key' => 'email_password',
        'value' => '8e8f02d0e1a851',
    ]);

    Setting::query()->create([
        'user_id' => $user->id,
        'key' => 'email_encryption',
        'value' => 'none',
    ]);

    actingAs($user);
    Mail::fake();

    $response = $this->post(route('settings.email.test'), [
        'email' => 'recipient@example.test',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    Mail::assertSent(TestMail::class);
});
