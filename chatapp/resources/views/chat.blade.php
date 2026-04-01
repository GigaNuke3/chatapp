@extends('layouts.app')

@section('title', 'Chat')

@section('content')
<div class="container-fluid" style="background-color: #1a1a1a; height: 100vh;">
    <div class="row" style="height: 100vh;">
        <!-- Users List -->
        <div class="col-md-3" style="background-color: #2d2d2d; border-right: 1px solid #444; overflow-y: auto;">
            <div class="p-3">
                <h5 style="color: #fff;">Users</h5>
                <div class="list-group">
                    @forelse($users as $user)
                        <a href="{{ route('chat.show', $user->id) }}" 
                           class="list-group-item list-group-item-action"
                           style="background-color: #3d3d3d; color: #fff; border: none; margin-bottom: 5px; border-radius: 5px;">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">{{ $user->name }}</h6>
                            </div>
                            <p class="mb-1" style="color: #ccc;">{{ $user->email }}</p>
                        </a>
                    @empty
                        <p style="color: #999;">No users available</p>
                    @endforelse
                </div>
            </div>
        </div>

        <!-- Chat Area -->
        <div class="col-md-9 d-flex flex-column" style="background-color: #1a1a1a;">
            <div style="background-color: #2d2d2d; padding: 1rem; border-bottom: 1px solid #444; text-align: center;">
                <h5 style="color: #fff; margin: 0;">Select a user to start chatting</h5>
            </div>
            <div class="flex-grow-1 p-3" style="overflow-y: auto;">
                <p style="color: #999; text-align: center;">Choose a user from the list to begin</p>
            </div>
        </div>
    </div>
</div>
@endsection
