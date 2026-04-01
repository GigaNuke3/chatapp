@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="container" style="background-color: #2d2d2d; border-radius: 10px;">
    <div class="row">
        <div class="col-md-12">
            <div class="card" style="background-color: #2d2d2d; border: 1px solid #444;">
                <div class="card-header" style="background-color: #3d3d3d; border-bottom: 1px solid #555;">
                    <h5 style="margin: 0; color: #fff;">Welcome, {{ Auth::user()->name }}!</h5>
                </div>
                <div class="card-body" style="background-color: #2d2d2d;">
                    <p style="color: #ccc;">You are successfully logged in.</p>
                    <p style="color: #ccc;">Email: {{ Auth::user()->email }}</p>
                    <a href="{{ route('chat.index') }}" class="btn btn-primary">Start Chatting</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection