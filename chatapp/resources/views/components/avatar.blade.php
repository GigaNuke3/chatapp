@props(['user', 'size' => 'md', 'showStatus' => false, 'statusOnline' => false])

@php
    $sizeClasses = match($size) {
        'sm' => 'w-8 h-8',
        'md' => 'w-10 h-10',
        'lg' => 'w-14 h-14',
        'sidebar' => 'w-9 h-9',
        default => 'w-10 h-10'
    };
    
    $avatarPath = $user->avatar ? \Illuminate\Support\Facades\Storage::url($user->avatar) : null;
    $initials = strtoupper(substr($user->name, 0, 1));
@endphp

<div class="avatar-wrapper relative">
    @if($avatarPath)
        <img 
            src="{{ $avatarPath }}" 
            alt="{{ $user->name }}" 
            class="avatar-image {{ $sizeClasses }} rounded-full object-cover border-2 border-slate-600"
        >
    @else
        <div class="avatar-placeholder {{ $sizeClasses }} rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            {{ $initials }}
        </div>
    @endif
    
    @if($showStatus)
        <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full {{ $statusOnline ? 'bg-green-500' : 'bg-slate-500' }} border-2 border-slate-900"></div>
    @endif
</div>
