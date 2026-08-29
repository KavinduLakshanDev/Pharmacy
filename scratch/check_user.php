<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'company@example.com')->first();
if ($user) {
    echo 'Type: ' . $user->type . "\n";
    echo 'Role: ' . $user->getRoleNames()->first() . "\n";
    echo 'Permissions: ' . $user->getAllPermissions()->pluck('name')->implode(',') . "\n";
} else {
    echo "User not found.\n";
}
