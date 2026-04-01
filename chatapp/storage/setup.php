<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

return function () {
    $count = User::count();
    
    if ($count < 2) {
        User::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
        ]);
        
        User::create([
            'name' => 'Bob Smith',
            'email' => 'bob@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
        ]);
        
        echo "✓ Created 2 test users\n";
        echo "  - alice@example.com / password123\n";
        echo "  - bob@example.com / password123\n";
    } else {
        echo "✓ Test users already exist\n";
    }
    
    echo "\nUsers in database:\n";
    User::all(['id', 'name', 'email'])->each(fn($u) => echo "  [{$u->id}] {$u->name} ({$u->email})\n");
};
