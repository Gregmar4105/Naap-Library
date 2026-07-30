<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * List all users with their roles (Inertia data, consumed by settings/index).
     */
    public function index()
    {
        $users = User::with('roles')
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'roles'      => $u->roles->pluck('name'),
                'created_at' => $u->created_at?->toDateString(),
            ]);

        $roles = Role::orderBy('name')->pluck('name');

        return compact('users', 'roles');
    }

    /**
     * Create a new user and assign a role.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::defaults()],
            'role'     => ['required', 'string', Rule::exists('roles', 'name')],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', "User \"{$user->name}\" created successfully.");
    }

    /**
     * Update an existing user (name, email, optional password, role).
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', Password::defaults()],
            'role'     => ['required', 'string', Rule::exists('roles', 'name')],
        ]);

        $user->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
            ...( ! empty($validated['password'])
                ? ['password' => Hash::make($validated['password'])]
                : []
            ),
        ]);

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "User \"{$user->name}\" updated successfully.");
    }

    /**
     * Delete a user (cannot delete self).
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "User \"{$name}\" deleted.");
    }
}
