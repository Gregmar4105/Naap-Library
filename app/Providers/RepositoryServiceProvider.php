<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\StudentRepositoryInterface;
use App\Repositories\Eloquent\EloquentStudentRepository;
use App\Repositories\Contracts\SurveyRepositoryInterface;
use App\Repositories\Eloquent\EloquentSurveyRepository;
use App\Repositories\Contracts\LostIdRepositoryInterface;
use App\Repositories\Eloquent\EloquentLostIdRepository;
use App\Repositories\Contracts\AccessAttemptRepositoryInterface;
use App\Repositories\Eloquent\EloquentAccessAttemptRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(StudentRepositoryInterface::class, EloquentStudentRepository::class);
        $this->app->bind(SurveyRepositoryInterface::class, EloquentSurveyRepository::class);
        $this->app->bind(LostIdRepositoryInterface::class, EloquentLostIdRepository::class);
        $this->app->bind(AccessAttemptRepositoryInterface::class, EloquentAccessAttemptRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
