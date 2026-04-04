<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\MessageController;
use App\Models\User;
use App\Models\Message;

Route::view('/', 'auth.login')->name('home');

//Login Routes 
Route::get('/login', [App\Http\Controllers\Auth\LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [App\Http\Controllers\Auth\LoginController::class, 'login']);
Route::post('/logout', [App\Http\Controllers\Auth\LoginController::class, 'logout'])->name('logout');
Route::get('/register', [App\Http\Controllers\Auth\RegisterController::class, 'showRegistrationForm'])->name('register');
Route::post('/register', [App\Http\Controllers\Auth\RegisterController::class, 'register']);

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth')->name('dashboard');

$getOnlineUserIds = static function (): array {
    $activeSinceTimestamp = now()->subMinutes((int) config('session.lifetime'))->getTimestamp();

    return DB::table(config('session.table', 'sessions'))
        ->whereNotNull('user_id')
        ->where('last_activity', '>=', $activeSinceTimestamp)
        ->pluck('user_id')
        ->map(static fn ($id) => (int) $id)
        ->unique()
        ->values()
        ->all();
};

Route::middleware('auth')->group(function () use ($getOnlineUserIds) {
    // Chat pages
    Route::get('/chat', function () {
        $users = User::where('id', '!=', Auth::id())->get();

        if ($users->isEmpty()) {
            return redirect()->route('dashboard');
        }

        return redirect()->route('chat.show', $users->first());
    })->name('chat.index');

    Route::get('/chat/{user}', function (User $user) use ($getOnlineUserIds) {
        // Prevent user from viewing their own chat
        if ($user->id === Auth::id()) {
            return redirect()->route('chat.index');
        }

        $users = User::where('id', '!=', Auth::id())->get();
        $onlineUserIds = $getOnlineUserIds();
        $isSelectedUserOnline = in_array($user->id, $onlineUserIds, true);
        $messages = Message::where(function ($q) use ($user) {
                $q->where('sender_id', Auth::id())
                  ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->where('receiver_id', Auth::id());
            })
            ->with('sender', 'receiver')
            ->orderBy('created_at', 'asc')
            ->get();

        return view('chat-show', compact('users', 'user', 'messages', 'onlineUserIds', 'isSelectedUserOnline'));
    })->name('chat.show');

    // API routes for messages
    Route::post('/api/messages', [MessageController::class, 'send'])->name('message.send');
    Route::get('/api/messages/{user}', [MessageController::class, 'getMessages'])->name('message.get');
    Route::post('/api/messages/{message}/delete', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::post('/api/messages/batch-delete', [MessageController::class, 'batchDelete'])->name('message.batch-delete');
});
