<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SpringProxyController extends Controller
{
    public function forward(Request $request, string $service, ?string $path = null): JsonResponse
    {
        $baseUrl = match ($service) {
            'accounts' => rtrim(config('services.spring.account_url'), '/'),
            'transactions' => rtrim(config('services.spring.transaction_url'), '/'),
            'blockchain' => rtrim(config('services.spring.blockchain_url'), '/'),
            default => null,
        };

        if (! $baseUrl) {
            return response()->json([
                'status' => 'error',
                'data' => null,
                'message' => 'Unsupported spring service',
            ], 404);
        }

        $targetPath = $service.($path ? '/'.$path : '');
        $targetUrl = $baseUrl.'/'.$targetPath;

        $headers = [
            'Authorization' => (string) $request->header('Authorization', ''),
            'Accept' => 'application/json',
        ];

        $method = strtoupper($request->method());
        $queryParams = $request->query();
        $payload = $request->all();

        $springResponse = Http::withHeaders($headers)
            ->send($method, $targetUrl, [
                'query' => $queryParams,
                'json' => $payload,
            ]);

        return response()->json($springResponse->json(), $springResponse->status());
    }
}
