@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    Welcome, {{ Auth::user()->name }}!
                </div>
                <div class="card-body">
                    <p>You are successfully logged in.</p>
                    <p>Email: {{ Auth::user()->email }}</p>
                    <a href="#" class="btn btn-primary">Start Chatting</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection