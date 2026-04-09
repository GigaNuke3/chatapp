@extends('layouts.app')

@section('title', 'My Profile')

@section('content')
<div class="container" style="max-width: 760px; margin-top: 2rem; margin-bottom: 2rem;">
    <div class="card" style="border: 1px solid #444;">
        <div class="card-header" style="background-color: #3d3d3d; border-bottom: 1px solid #555;">
            <h5 style="margin: 0; color: #fff;">Profile Settings</h5>
        </div>

        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success" style="background-color: #1f6f43; border-color: #2b8a57; color: #d8ffe9;">
                    {{ session('success') }}
                </div>
            @endif

            @if($errors->any())
                <div class="alert alert-danger">
                    @foreach($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            <form method="POST" action="{{ route('profile.update') }}" enctype="multipart/form-data">
                @csrf
                @method('PUT')

                <div class="mb-3 text-center">
                    @if($user->avatar)
                        <img src="{{ asset('storage/' . $user->avatar) }}" alt="{{ $user->name }}" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 2px solid #555;">
                    @else
                        <div style="width: 84px; height: 84px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #5f7cf5 0%, #55b6d9 100%); color: #fff; font-size: 28px; font-weight: 700; border: 2px solid #555;">
                            {{ strtoupper(substr($user->name, 0, 1)) }}
                        </div>
                    @endif
                </div>

                <div class="mb-3">
                    <label for="avatar" class="form-label" style="color: #ccc;">Profile Photo</label>
                    <input type="file" id="avatar" name="avatar" class="form-control" accept="image/*">
                </div>

                <div class="mb-3">
                    <label for="name" class="form-label" style="color: #ccc;">Name</label>
                    <input type="text" id="name" name="name" class="form-control" value="{{ old('name', $user->name) }}" required>
                </div>

                <div class="mb-3">
                    <label for="email" class="form-label" style="color: #ccc;">Email</label>
                    <input type="email" id="email" name="email" class="form-control" value="{{ old('email', $user->email) }}" required>
                </div>

                <div class="mb-3">
                    <label for="bio" class="form-label" style="color: #ccc;">Bio</label>
                    <textarea id="bio" name="bio" class="form-control" rows="4" maxlength="500" placeholder="Write a short bio...">{{ old('bio', $user->bio) }}</textarea>
                    <div style="font-size: 12px; color: #999; margin-top: 6px;">Max 500 characters.</div>
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <a href="{{ route('dashboard') }}" class="btn btn-outline-light">Back</a>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
