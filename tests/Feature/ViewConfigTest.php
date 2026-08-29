<?php

use Illuminate\Support\Facades\File;

it('uses a valid compiled view path', function () {
    $compiledPath = config('view.compiled');

    expect($compiledPath)
        ->toBeString()
        ->not->toBeEmpty();

    expect(File::isDirectory($compiledPath))->toBeTrue();
});
