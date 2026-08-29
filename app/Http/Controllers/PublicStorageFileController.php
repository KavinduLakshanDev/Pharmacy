<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublicStorageFileController extends Controller
{
    /**
     * Serve files from the public disk when the web server does not resolve
     * the storage symlink (or returns 403). Safe path only under storage/app/public.
     */
    public function __invoke(string $path): StreamedResponse
    {
        if (str_contains($path, '..')) {
            abort(404);
        }

        $path = ltrim($path, '/');

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            abort(404);
        }

        return $disk->response($path);
    }
}
