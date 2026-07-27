<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface BaseRepositoryInterface
{
    public function all(): Collection;
    public function find(mixed $id): ?Model;
    public function findOrFail(mixed $id): Model;
    public function create(array $attributes): Model;
    public function update(mixed $id, array $attributes): bool;
    public function delete(mixed $id): bool;
    public function paginate(int $perPage = 15): LengthAwarePaginator;
}
