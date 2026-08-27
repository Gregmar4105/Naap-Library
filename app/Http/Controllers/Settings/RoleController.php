<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /** Core roles that cannot be deleted */
    private const CORE_ROLES = ['Admin', 'Library Staff', 'Student'];

    /**
     * List all roles with their user counts (Inertia data).
     */
    public function index(): array
    {
        return Role::withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id'         => $role->id,
                'name'       => $role->name,
                'users_count'=> $role->users_count,
                'is_core'    => in_array($role->name, self::CORE_ROLES),
            ])
            ->toArray();
    }

    /**
     * Create a new role.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
        ]);

        Role::create(['name' => $validated['name'], 'guard_name' => 'web']);

        return back()->with('success', "Role \"{$validated['name']}\" created.");
    }

    /**
     * Rename a role (core roles are protected from renaming).
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        if (in_array($role->name, self::CORE_ROLES)) {
            return back()->with('error', "Core role \"{$role->name}\" cannot be renamed.");
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)],
        ]);

        $role->update(['name' => $validated['name']]);

        return back()->with('success', "Role renamed to \"{$validated['name']}\".");
    }

    /**
     * Delete a role (core roles are protected).
     */
    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, self::CORE_ROLES)) {
            return back()->with('error', "Core role \"{$role->name}\" cannot be deleted.");
        }

        $name = $role->name;
        $role->delete();

        return back()->with('success', "Role \"{$name}\" deleted.");
    }
}
