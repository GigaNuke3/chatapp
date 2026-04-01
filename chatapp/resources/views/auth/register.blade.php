@extends('layouts.app')

@section('title', 'Register')

@section('content')
<div class="container" style="background-color: #2d2d2d; margin-top: 2rem; border-radius: 10px;">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card" style="background-color: #2d2d2d; border: 1px solid #444;">
                <div class="card-header" style="background-color: #3d3d3d; border-bottom: 1px solid #555;">
                    <h5 style="margin: 0; color: #fff;">Register</h5>
                </div>
                <div class="card-body" style="background-color: #2d2d2d;">
                    @if ($errors->any())
                        <div class="alert alert-danger" style="background-color: #8b3a3a; border-color: #c85555; color: #ff9999;">
                            @foreach ($errors->all() as $error)
                                <div>{{ $error }}</div>
                            @endforeach
                        </div>
                    @endif

                    <form method="POST" action="{{ route('register') }}" enctype="multipart/form-data">
                        @csrf

                        <div class="mb-3">
                            <label for="name" style="color: #ccc;">Full Name</label>
                            <input id="name" type="text" class="form-control" name="name" value="{{ old('name') }}" required style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        </div>

                        <div class="mb-3">
                            <label for="email" style="color: #ccc;">Email Address</label>
                            <input id="email" type="email" class="form-control" name="email" value="{{ old('email') }}" required style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        </div>

                        <div class="mb-3">
                            <label for="avatar" style="color: #ccc;">Profile Photo (Optional)</label>
                            <input id="avatar" type="file" class="form-control" name="avatar" accept="image/*" style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                            <small style="color: #999;">Accepted formats: JPEG, PNG, JPG, GIF (Max 2MB)</small>
                        </div>

                        <div class="mb-3">
                            <label for="password" style="color: #ccc;">Password</label>
                            <input id="password" type="password" class="form-control" name="password" required style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        </div>

                        <div class="mb-3">
                            <label for="password_confirmation" style="color: #ccc;">Confirm Password</label>
                            <input id="password_confirmation" type="password" class="form-control" name="password_confirmation" required style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        </div>

                        <button type="submit" class="btn btn-primary">Register</button>
                        <a href="{{ route('login') }}" class="btn btn-link">Already have an account? Login</a>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection