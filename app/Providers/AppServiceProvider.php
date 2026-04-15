<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->loadMailSettings();

        if (app()->isProduction()) {
            URL::forceScheme('https');
        }
    }

    /**
     * Load mail settings from database and override config.
     */
    protected function loadMailSettings(): void
    {
        try {
            if (app()->runningInConsole() || !DB::connection()->getPdo()) {
                return;
            }

            $settings = \App\Models\Setting::where('key', 'LIKE', 'mail_%')->get()->pluck('value', 'key');

            if ($settings->isNotEmpty()) {
                $encryption = strtolower((string) $settings->get('mail_encryption', ''));
                $scheme = match($encryption) {
                    'ssl' => 'ssl',
                    'tls' => 'tls',
                    default => null,
                };

                config([
                    'mail.mailers.smtp.host'     => $settings->get('mail_host', config('mail.mailers.smtp.host')),
                    'mail.mailers.smtp.port'     => (int) ($settings->get('mail_port', config('mail.mailers.smtp.port'))),
                    'mail.mailers.smtp.scheme'   => $scheme,
                    'mail.mailers.smtp.username' => $settings->get('mail_username', config('mail.mailers.smtp.username')),
                    'mail.mailers.smtp.password' => $settings->get('mail_password', config('mail.mailers.smtp.password')),
                    'mail.from.address'          => $settings->get('mail_from_address', config('mail.from.address')),
                    'mail.from.name'             => $settings->get('mail_from_name', config('mail.from.name')),
                ]);

                if ($settings->has('mail_host') && $settings->get('mail_host') !== '') {
                    config(['mail.default' => 'smtp']);
                }
            }
        } catch (\Exception $e) {
            // Silently fail if table doesn't exist yet or connection fails
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
