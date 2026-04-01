<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatApp - @yield('title')</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        body {
            background-color: #1a1a1a;
            color: #fff;
        }
        .container {
            background-color: #2d2d2d;
            border-radius: 5px;
            padding: 2rem;
            color: #fff;
        }
        .card {
            background-color: #2d2d2d;
            border: 1px solid #444;
            color: #fff;
        }
        .card-header {
            background-color: #3d3d3d;
            border-bottom: 1px solid #555;
        }
        .btn-primary {
            background-color: #007bff;
            border-color: #0056b3;
        }
        .btn-primary:hover {
            background-color: #0056b3;
        }
        .btn-link {
            color: #007bff;
        }
        .btn-link:hover {
            color: #0056b3;
        }
        .form-control {
            background-color: #3d3d3d;
            border: 1px solid #555;
            color: #fff;
        }
        .form-control:focus {
            background-color: #3d3d3d;
            border-color: #007bff;
            color: #fff;
        }
        .form-check-input {
            background-color: #3d3d3d;
            border: 1px solid #555;
        }
        .alert-danger {
            background-color: #8b3a3a;
            border-color: #c85555;
            color: #ff9999;
        }
    </style>
</head>
<body style="background-color: #1a1a1a; margin: 0; padding: 0;">
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #2d2d2d; flex-shrink: 0;">
        <div class="container-fluid">
            <a class="navbar-brand" href="/" style="color: #fff;">ChatApp</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    @auth
                        <li class="nav-item">
                            <a class="nav-link" href="/dashboard" style="color: #ccc;">Dashboard</a>
                        </li>
                        <li class="nav-item">
                            <form method="POST" action="{{ route('logout') }}" style="display:inline;">
                                @csrf
                                <button type="submit" class="nav-link btn btn-link" style="color: #ccc;">Logout</button>
                            </form>
                        </li>
                    @else
                        <li class="nav-item">
                            <a class="nav-link" href="/login" style="color: #ccc;">Login</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/register" style="color: #ccc;">Register</a>
                        </li>
                    @endauth
                </ul>
            </div>
        </div>
    </nav>

    <main class="py-4" style="background-color: #1a1a1a; min-height: 100vh; flex: 1;">
        @yield('content')
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
