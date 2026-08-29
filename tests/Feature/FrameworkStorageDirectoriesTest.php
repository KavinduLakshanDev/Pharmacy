<?php

it('keeps the Laravel framework storage directories available', function () {
    $frameworkStoragePath = storage_path('framework');

    expect(is_dir($frameworkStoragePath))->toBeTrue();
    expect(is_dir($frameworkStoragePath.DIRECTORY_SEPARATOR.'cache'))->toBeTrue();
    expect(is_dir($frameworkStoragePath.DIRECTORY_SEPARATOR.'sessions'))->toBeTrue();
    expect(is_dir($frameworkStoragePath.DIRECTORY_SEPARATOR.'views'))->toBeTrue();
    expect(is_file($frameworkStoragePath.DIRECTORY_SEPARATOR.'.gitignore'))->toBeTrue();
    expect(is_file($frameworkStoragePath.DIRECTORY_SEPARATOR.'cache'.DIRECTORY_SEPARATOR.'.gitignore'))->toBeTrue();
    expect(is_file($frameworkStoragePath.DIRECTORY_SEPARATOR.'sessions'.DIRECTORY_SEPARATOR.'.gitignore'))->toBeTrue();
    expect(is_file($frameworkStoragePath.DIRECTORY_SEPARATOR.'views'.DIRECTORY_SEPARATOR.'.gitignore'))->toBeTrue();
});
