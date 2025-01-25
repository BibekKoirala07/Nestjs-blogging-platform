# Backend Blog Platform

A robust backend API for a blogging platform built with Node.js and PostgreSQL, featuring user authentication, blog post management, comments, and image uploads.

## 🛠️ Tech Stack
- **Backend:** Node.js(23-alpine)
- **Database:** PostgreSQL(17:latest)
- **Containerization:** Docker(27+)

## Environment Setup
1. Ensure you have Docker installed.
2. Configure `.env` file with necessary variables (refer to `.env.example`).
3. Database configurations and other sensitive data should be set in `.env`.

### Authentication
- JWT-based authentication.
- Token required for protected routes (provided as Bearer Token).
- Role-based access control implemented.

### Error Handling
- Standard HTTP status codes.
- Detailed error messages for debugging.
- Validation errors handled appropriately.

## 🚀 Quick Start

1. Clone the repository:
    ```bash
    git clone https://github.com/intujicoder/associate-bibek-koirala.git
    cd associate-bibek-koirala
    git checkout bibek
    ```

2. Create the environment file:
    ```bash
    cp .env.example .env
    ```

3. Start the Docker containers:
    ```bash
    docker compose up --build -d
    ```

## 🔑 Default Super Admin Credentials
After the initial setup, you can log in with these credentials:
- **Username:** `superadmin`
- **Password:** `superAdminPassword`
- **Role:** `ADMIN`

## 🛣️ API Routes

### Authentication and User Profile
- `POST /api/users/register` - Register user (with role: "ADMIN" or "USER").
- `POST /api/users/login` - Login (requires registration first).
- `GET /api/users/profile` - Get user profile.
- `PATCH /api/users/profile` - Update user profile.
- `GET /api/users` - View all users.

### Blog, Comments, Image Routes
- `POST /api/posts` - Create a new post.
- `GET /api/posts` - Get all blog posts.
- `GET /api/posts/:id` - Get specific blog post.
- `POST /api/posts/:postId/comments` - Add comment to post.
- `GET /api/posts/:postId/comments` - Get all comments for post.
- `POST /api/posts/:postId/images` - Upload image for post.
- `DELETE /api/posts/:postId/images` - Delete image for post.

## 🔐 Role-Based Access
- **Admin Privileges:**
  - View all users.
  - Full access to all endpoints.
  - Can update or delete posts even if the user isn’t the author.

- **User Privileges:**
  - Limited access to user-specific data.
  - Cannot update or delete posts created by other users.
  - Cannot view the list of all users.
