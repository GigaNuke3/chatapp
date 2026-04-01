@extends('layouts.app')

@section('content')
<div class="container" style="background-color: #2d2d2d; margin-top: 2rem; border-radius: 10px;">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card" style="background-color: #2d2d2d; border: 1px solid #444;">
                <div class="card-header" style="background-color: #3d3d3d; border-bottom: 1px solid #555;">
                    <h5 style="margin: 0; color: #fff;">Login</h5>
                </div>
                <div class="card-body" style="background-color: #2d2d2d;">
                    @if ($errors->any())
                        <div class="alert alert-danger" style="background-color: #8b3a3a; border-color: #c85555; color: #ff9999;">
                            @foreach ($errors->all() as $error)
                                <div>{{ $error }}</div>
                            @endforeach
                        </div>
                    @endif

                    <form method="POST" action="{{ route('login') }}">
                        @csrf

                        <div class="mb-3">
                            <label for="email" style="color: #ccc;">Email Address</label>
                            <input id="email" type="email" class="form-control" name="email" value="{{ old('email') }}" required style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        </div>

                        <div class="mb-3">
                            <label for="password" style="color: #ccc;">Password</label>
                            <input id="password" type="password" class="form-control" name="password" required style="background-color: #3d3d3d; color: #fff; border: 1px solid #555;">
                        </div>

                        <div class="mb-3 form-check">
                            <input type="checkbox" name="remember" id="remember" style="background-color: #3d3d3d; border: 1px solid #555;">
                            <label for="remember" style="color: #ccc;">Remember Me</label>
                        </div>

                        <button type="submit" class="btn btn-primary">Login</button>
                        <a href="{{ route('register') }}" class="btn btn-link">Need an account? Register</a>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection