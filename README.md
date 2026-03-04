# Frontend Direct Upload via SAS Token

A full-stack web application that demonstrates **direct-to-Azure Blob Storage file uploads** from the browser using **Shared Access Signature (SAS) tokens**. Users can register with a profile image that is uploaded directly to Azure Blob Storage — without the file ever passing through the backend server.

---

## How It Works

```
Browser ──(1) request SAS URL──► Backend (Express)
                                       │
                                       │ generates short-lived SAS token
                                       ▼
Browser ◄──(2) return SAS URL ── Backend (Express)
    │
    │ (3) PUT file directly
    ▼
Azure Blob Storage
    │
    │ (4) save image URL
    ▼
Backend (Express) ──► MongoDB (save user record)
```

1. The frontend requests a **time-limited SAS upload URL** from the backend.
2. The backend validates the file type and size, then generates a SAS token using Azure Storage credentials and returns the signed URL.
3. The frontend uploads the image **directly to Azure Blob Storage** using an HTTP `PUT` request — the file never touches the backend.
4. After upload, the frontend sends the user's name, email, and the resulting image URL to the backend, which saves the record to MongoDB.

---

## Tech Stack

| Layer    | Technology                                         |
| -------- | -------------------------------------------------- |
| Frontend | React 18, Vite, Axios                              |
| Backend  | Node.js, Express 5, Mongoose                       |
| Database | MongoDB (via Mongoose)                             |
| Storage  | Azure Blob Storage (`@azure/storage-blob` SDK v12) |
| Auth     | Azure Storage Shared Key + SAS token generation    |

---

## Project Structure

```
├── Backend/
│   ├── server.js          # Express API server
│   ├── azureStorage.js    # Azure Blob Storage client & helpers
│   ├── package.json
│   └── Models/
│       └── users.js       # Mongoose User schema
│
└── Frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Register.jsx   # Registration form + direct upload logic
        │   └── Profile.jsx    # Lists all users with profile images
        └── assets/
```

---

## API Endpoints

| Method | Endpoint               | Description                                             |
| ------ | ---------------------- | ------------------------------------------------------- |
| POST   | `/generate-upload-url` | Validates file and returns a SAS upload URL + blob path |
| POST   | `/register`            | Saves a new user (name, email, profileImage URL)        |
| GET    | `/users`               | Returns all registered users                            |
| DELETE | `/users/:email`        | Deletes a user and their blob folder from Azure         |

### `POST /generate-upload-url`

**Request body:**

```json
{
  "userId": "user@example.com",
  "fileType": "image/jpeg",
  "fileSize": 102400
}
```

**Validation rules:**

- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: **2 MB**
- SAS token expires in **10 minutes**

**Response:**

```json
{
  "uploadUrl": "https://<account>.blob.core.windows.net/profile-images/<userId>/profile.jpg?<sas-token>",
  "fileName": "<userId>/profile.jpg"
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB connection string (local or Atlas)
- An Azure Storage account with a container named `profile-images`

### 1. Clone the repository

```bash
git clone <repo-url>
cd frontend-direct-upload-sas
```

### 2. Configure the Backend

Create a `.env` file inside the `Backend/` folder:

```env
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_STORAGE_KEY=your_account_key
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
MONGO_URI=your_mongodb_connection_string
```

Install dependencies and start the server:

```bash
cd Backend
npm install
node server.js
```

The backend starts on **http://localhost:5000**.

### 3. Configure the Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

---

## Key Concepts

### Why Direct Upload via SAS?

Uploading files through a backend server means the file travels: **Client → Server → Azure**. For large files this wastes server bandwidth and memory.

With **SAS tokens**, the upload path becomes: **Client → Azure** directly. The backend only issues a short-lived, scoped credential — it never handles the binary data itself. This approach is:

- **Scalable** — no file buffering on the server
- **Secure** — the SAS token is scoped to a single blob, expires quickly, and grants only write permission (`cw`)
- **Cost-effective** — reduced egress and compute on the backend

### Blob Naming Convention

Each user's profile image is stored at:

```
profile-images/{userId}/profile.jpg
```

where `userId` is the user's email address. Deleting a user also deletes their entire folder prefix in Azure Blob Storage.
