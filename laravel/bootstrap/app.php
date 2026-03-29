<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => App\Http\Middleware\EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (ValidationException $exception) {
            return response()->json([
                'status' => 'error',
                'data' => $exception->errors(),
                'message' => 'Validation failed',
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception) {
            return response()->json([
                'status' => 'error',
                'data' => null,
                'message' => 'Unauthorized',
            ], 401);
        });

        $exceptions->render(function (HttpExceptionInterface $exception) {
            return response()->json([
                'status' => 'error',
                'data' => null,
                'message' => $exception->getMessage() ?: 'HTTP error',
            ], $exception->getStatusCode());
        });
    })->create();
