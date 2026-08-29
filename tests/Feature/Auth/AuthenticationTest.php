<?php

use App\Models\User;
use Illuminate\Support\Facades\Schema;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('login screen can be rendered when currencies table is missing', function () {
    Schema::dropIfExists('currencies');

    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('translations route can be loaded when currencies table is missing', function () {
    file_put_contents(storage_path('installed'), '');
    Schema::dropIfExists('currencies');

    try {
        $response = $this->get('/translations/en');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'translations',
            'layoutDirection',
            'locale',
        ]);
    } finally {
        if (file_exists(storage_path('installed'))) {
            unlink(storage_path('installed'));
        }
    }
});
