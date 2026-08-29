<?php

test('all frontend translation keys exist in the English locale file', function () {
    $rootPath = dirname(__DIR__, 2);
    $translationFile = $rootPath.'/resources/lang/en.json';
    $translations = json_decode(file_get_contents($translationFile), true);

    $directory = new RecursiveDirectoryIterator($rootPath.'/resources/js');
    $iterator = new RecursiveIteratorIterator($directory);
    $keys = [];

    foreach ($iterator as $file) {
        if (! $file->isFile()) {
            continue;
        }

        if (! preg_match('/\.(ts|tsx|js|jsx)$/', $file->getFilename())) {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        preg_match_all('/t\(\s*["\']([^"\']+)["\']\s*\)/', $content, $matches);

        foreach ($matches[1] as $key) {
            $keys[$key] = true;
        }
    }

    $missingKeys = array_filter(array_keys($keys), fn (string $key) => ! array_key_exists($key, $translations));

    expect($missingKeys)->toHaveCount(0, 'Missing translation keys: '.implode(', ', $missingKeys));
});
