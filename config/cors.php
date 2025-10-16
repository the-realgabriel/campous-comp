<?php
// config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_origins' => [
        'http://localhost:5173',    // Vite dev server
        'http://127.0.0.1:5173',
        // add your production frontend URL here
    ], 

    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
    // ... rest of the file
];