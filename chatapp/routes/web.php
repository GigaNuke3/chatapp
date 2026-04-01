<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessageController;
use App\Models\User;
use App\Models\Message;

//Login Routes 
Route::get('/login', [App\Http\Controllers\Auth\LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [App\Http\Controllers\Auth\LoginController::class, 'login']);
Route::post('/logout', [App\Http\Controllers\Auth\LoginController::class, 'logout'])->name('logout');
Route::get('/register', [App\Http\Controllers\Auth\RegisterController::class, 'showRegistrationForm'])->name('register');
Route::post('/register', [App\Http\Controllers\Auth\RegisterController::class, 'register']);

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    // Chat pages
    Route::get('/chat', function () {
        $users = User::where('id', '!=', auth()->id())->get();
        return view('chat', compact('users'));
    })->name('chat.index');

    Route::get('/chat/{user}', function (User $user) {
        // Prevent user from viewing their own chat
        if ($user->id == auth()->id()) {
            return redirect()->route('chat.index');
        }

        $users = User::where('id', '!=', auth()->id())->get();
        $messages = Message::where(function ($q) use ($user) {
                $q->where('sender_id', auth()->id())
                  ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->where('receiver_id', auth()->id());
            })
            ->with('sender', 'receiver')
            ->orderBy('created_at', 'asc')
            ->get();

        return view('chat-show', compact('users', 'user', 'messages'));
    })->name('chat.show');

    // API routes for messages
    Route::post('/api/messages', [MessageController::class, 'send'])->name('message.send');
    Route::get('/api/messages/{user}', [MessageController::class, 'getMessages'])->name('message.get');
    Route::post('/api/messages/{message}/delete', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::post('/api/messages/batch-delete', [MessageController::class, 'batchDelete'])->name('message.batch-delete');
});
