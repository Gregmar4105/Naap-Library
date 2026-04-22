<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use App\Models\AuditTrail;

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

        Event::listen(Login::class, function (Login $event) {
            AuditTrail::create([
                'user_id' => $event->user->id,
                'user_name' => $event->user->name,
                'auditable_type' => get_class($event->user),
                'auditable_id' => $event->user->id,
                'event' => 'login',
                'activity' => 'User Logged In',
                'ip_address' => request()->ip() ?: (request()->server('REMOTE_ADDR') ?: '127.0.0.1'),
                'created_at' => now(),
            ]);
        });

        Event::listen(Logout::class, function (Logout $event) {
            if ($event->user) {
                AuditTrail::create([
                    'user_id' => $event->user->id,
                    'user_name' => $event->user->name,
                    'auditable_type' => get_class($event->user),
                    'auditable_id' => $event->user->id,
                    'event' => 'logout',
                    'activity' => 'User Logged Out',
                    'ip_address' => request()->ip() ?: (request()->server('REMOTE_ADDR') ?: '127.0.0.1'),
                    'created_at' => now(),
                ]);
            }
        });
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
                $port = (int) ($settings->get('mail_port', config('mail.mailers.smtp.port')));
                $scheme = match($encryption) {
                    'ssl', 'smtps' => 'smtps',
                    'tls' => ($port === 465 ? 'smtps' : null),
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
                
                app('mail.manager')->purge('smtp');
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
