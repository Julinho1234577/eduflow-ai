<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'admin@eduflow.test',
            ],
            [
                'name' => 'Administrador',
                'password' => Hash::make('Admin12345'),
                'role' => 'admin',
            ]
        );
    }
}