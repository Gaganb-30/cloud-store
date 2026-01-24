# PROJECT HANDOFF: STORAGE SERVICE (CLOUDVAULT)

## 1. PROJECT OVERVIEW
**Project Name:** Storage Service (CloudVault)
**Description:** A self-hosted cloud storage solution similar to Google Drive or Dropbox. It allows users to upload, manage, and download files. It supports multiple storage backends (Local Disk and Cloudflare R2), user authentication, roles (Free/Premium/Admin), quotas, and background processing for file expiry and cleanup.
**Goals:** Provide a robust, scalable storage platform with premium monetization features (time-limited subscriptions) and anti-abuse mechanisms.
**Status:** **Functional MVP.** Core features (Upload, Download, Auth, Admin, R2 Integration) are working. Recent focus has been on stability, R2 large file support, and premium subscription logic.

---

## 2. TECH STACK
- **Language:** JavaScript (Node.js)
- **Frontend:** React (Vite), TailwindCSS, Framer Motion, Axios, React Router, Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (Mongoose) for metadata.
- **Caching/Queue:** Redis (configured for queues/caching).
- **Storage:**
  - **Local:** `fs` based storage.
  - **Cloud:** Cloudflare R2 (S3 Compatible AWS SDK v3).
- **Environment:** Node.js Runtime.

---

## 3. ARCHITECTURE OVERVIEW
The system follows a layered architecture:

1.  **Frontend (SPA):** React app checks auth state, manages file browsing, and handles uploads via a Chunked Upload mechanism handled in `UseContext`.
2.  **API Layer (Express):** Controllers validate input and delegate to Services.
3.  **Service Layer:** Business logic (e.g., `DownloadService`, `AdminService`, `ExpiryService`).
4.  **Provider Layer:** Abstractions for external systems (`StorageProvider`, `QueueProvider`, `CacheProvider`).
5.  **Data Layer:** MongoDB Models (`User`, `File`, `Folder`).
6.  **Workers:** Background processes run independently to handle cleanup, migration, and expiry.

**Data Flow:**
- **Upload:** Content -> (Frontend Chunks) -> API -> `UploadController` -> `StorageProvider` (Write Chunks) -> Assembly -> `File` Record Created.
- **Download:** Client -> API -> `DownloadService` -> `StorageProvider` (Get Stream) -> Pipe to Response.

---

## 4. FULL FILE & FOLDER STRUCTURE (Key Files)

```text
/
├── .env                        # Configuration secrets (Critical)
├── package.json
├── src/
│   ├── app.js                  # Express app setup
│   ├── server.js               # Entry point
│   ├── config/
│   │   └── index.js            # Central config loader (Environment variables)
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── downloadController.js
│   │   ├── r2UploadController.js # Handles R2-specific multipart uploads
│   │   └── ...
│   ├── models/
│   │   ├── File.js             # Mongoose schema for Files
│   │   ├── User.js             # Mongoose schema for Users (roles, premium expiry)
│   │   └── ...
│   ├── providers/
│   │   ├── storage/
│   │   │   ├── StorageProvider.js    # Base class
│   │   │   ├── R2StorageProvider.js  # R2 implementation (S3 SDK)
│   │   │   └── LocalStorageProvider.js
│   │   └── ...
│   ├── services/
│   │   ├── AdminService.js     # Admin logic (promote/demote)
│   │   ├── DownloadService.js  # Download logic, counters, bandwidth
│   │   └── ExpiryService.js    # File expiry logic
│   ├── workers/
│   │   ├── index.js            # Worker manager
│   │   ├── premiumExpiryWorker.js # Checks/downgrades expired premiums
│   │   └── expiryWorker.js     # Deletes expired files
│   └── utils/
│       └── logger.js
└── frontend/
    ├── src/
    │   ├── api/                # Axios instances
    │   ├── context/
    │   │   └── UploadContext.jsx # Complex upload queue & progress logic
    │   ├── pages/
    │   │   ├── Dashboard.jsx   # Main user view (Stats, File browser)
    │   │   └── Admin.jsx       # Admin panel
    │   └── components/         # UI components
```

---

## 5. FILE-BY-FILE BREAKDOWN (Critical/Modified Files)

### `src/models/User.js`
- **Purpose:** User capabilities and state.
- **Key Changes:**
  - Added `premiumExpiresAt` (Date): When premium status ends.
  - Virtual `isPremiumActive`: Checks role AND expiry date.
  - Method `getEffectiveRole()`: Returns 'free' if premium has expired.

### `src/models/File.js`
- **Purpose:** File metadata.
- **Key Changes:**
  - Added `uniqueDownloadIPs` (Array<String>): Tracks unique downloaders.
  - Updated `incrementDownload()`: Implements logic to shorten expiry to 1 day if unique downloads > 5 (for free files).

### `src/providers/storage/R2StorageProvider.js`
- **Purpose:** Cloudflare R2 interaction.
- **Key Logic:**
  - Manual prefix handling (`hot/`, `cold/`) to simulate tiers.
  - **Fixed:** Logic to prevent double-prefixing (e.g., `hot/hot/file`).
  - Methods: `write`, `read`, `delete`, `getStream` (Async).

### `src/controllers/r2UploadController.js`
- **Purpose:** Direct-to-R2 multipart uploads.
- **Configuration:** `partSize` set to **100MB** (up from 25MB) to support files up to ~1TB.

### `src/workers/premiumExpiryWorker.js`
- **Purpose:** Background job.
- **Logic:** Runs hourly. Finds `User`s with `premiumExpiresAt` < Now. Downgrades role to `UserRole.FREE` and sets expiry on their files (5 days).

### `frontend/src/pages/Dashboard.jsx`
- **Purpose:** Client Status.
- **Logic:** Calculates time remaining for premium users and displays it in the "Account Type" card (e.g., "Premium (2mo 29d left)").

### `src/config/index.js`
- **Purpose:** Environment Variable mapping.
- **New Vars:** `FILE_EXPIRY_DOWNLOAD_THRESHOLD`, `FILE_EXPIRY_DAYS_AFTER_THRESHOLD`.

---

## 6. CURRENT STATE OF IMPLEMENTATION

### Fully Implemented ✅
- **User Auth:** Login, Register, JWT, Roles.
- **Storage:** Local and R2 (Upload, Download, Delete).
- **R2 Integration:** Multipart uploads (100MB chunks), Presigned URLs, Prefix fix.
- **Admin:** Promote with duration, Block, Restrict, Demote.
- **Premium Features:** Time-limited subscriptions, auto-downgrade.
- **Anti-Abuse:** Free files expire physically. High-traffic free files (5+ unique IPs) expire faster (1 day).

### Planned / In Progress 🚧
- **Frontend Upload Throttling:** User reported upload progress UI flickers/freezes. Needs `requestAnimationFrame` or throttling in `UploadContext.jsx`.
- **Public Sharing:** Public links exist, but password protection/expiry UI might need polish.

### Known Issues 🐛
- **Frontend UI Lag:** High-frequency state updates during upload cause the UI "Time Left" to flicker or look frozen.

---

## 7. IMPORTANT DECISIONS & CONTEXT

1.  **R2 Part Size (100MB):** Cloudflare R2 has a 10,000 part limit. To support 400GB+ files, we increased chunk size from 25MB to 100MB (100MB * 10,000 = 1TB limit).
2.  **Anti-Abuse Expiry:** We track *Unique IPs* for downloads. Owner downloads do not count. This prevents a user from refreshing their own link to trigger expiry, but stops files from being used as a high-traffic CDN (Warez/Piracy prevention).
3.  **Soft Deltion:** Files are marked `isDeleted` before physical removal by the cleanup worker.

---

## 8. ENVIRONMENT / CONFIGURATION

**Key `.env` Variables:**

```bash
# Storage
STORAGE_PROVIDER=r2 # or 'local'
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Expiry & Abuse
FILE_EXPIRY_DAYS_FREE=5
FILE_EXPIRY_DOWNLOAD_THRESHOLD=5   # triggers fast expiry
FILE_EXPIRY_DAYS_AFTER_THRESHOLD=1 # fast expiry duration
```

**Running the Project:**
- Backend: `npm run dev` (starts server + workers).
- Frontend: `cd frontend && npm run dev` (Vite server).

---

## 9. HOW TO CONTINUE FROM HERE

**IMMEDIATE PRIORITY:**
1.  **Fix Upload UI Flickering:** Open `frontend/src/context/UploadContext.jsx`. Implement throttling (e.g., update state max once every 500ms) inside the `onUploadProgress` handler. The user explicitly complained about "freezed" time/speed updates compared to other hosts.

**Next Steps:**
2.  **Test Large Uploads:** Verify the 100MB chunk size works smoothly with a real >10GB file test on R2.
3.  **Refine Dashboard:** Ensure the "Premium Time Left" display handles edge cases (e.g., exactly 0 time left) gracefully.

---

## 10. HANDOFF SUMMARY
- **System is robust:** Backend logic is solid.
- **R2 is the primary storage:** Focus on R2 behavior.
- **Watch out for:** The Frontend Upload Context is complex and updating state too frequently. **Fix this first.**
- **New Feature:** "Premium Duration" and "Download Threshold Expiry" are the newest logic additions.

**END OF PROJECT HANDOFF**
