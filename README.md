# 🎓 Youth Research Forum (YRF)

> **Cultivating the Next Generation of Policy-Conscious Citizens**
>
> A world-class, student-led intellectual publishing platform rooted at Kalindi College, University of Delhi. Designed for rigorous academic inquiry, domestic & international policy debate, and long-form journal publication.

---

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![Firebase Service](https://img.shields.io/badge/Firebase-12.13.0-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Cloudinary CDN](https://img.shields.io/badge/Cloudinary-Signed_Uploads-teal?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌐 Live Demo

The production platform is hosted and active at:  
👉 **[https://youthresearchforum.org](https://youthresearchforum.org)**

---

## 🌟 Features

### 🔐 1. Authentication & Security
*   **Firebase Authentication System**: Seamless email/password authentication using the Firebase Web SDK.
*   **Adaptive Profiling**: Automatically checks and dynamically re-creates missing Firestore profile schemas on successful login.
*   **Re-authentication Security**: Requires current password validation before performing high-risk security actions (e.g., password changes).

### 👥 2. Role-Based Access Control (RBAC)
*   **Dual Roles**: Built-in support for `admin` (Editor-in-Chief) and `reader` identities.
*   **Layout Guards**: Clients are automatically redirected away from protected paths (e.g., `/admin/*`) using Next.js client router hooks if permissions are insufficient.
*   **Double-Verification Security**: Validates authorization context using both Client-Side state and Firebase Firestore Security Rules.

### 📝 3. Editorial & Article Management
*   **Markdown Writing Interface**: Rich custom Markdown editor in the admin section supporting titles, subtitles, category assignment, paragraph structures, blockquotes, lists, and images.
*   **Reading Time Analytics**: Automatically calculates reading time in minutes depending on content volume.
*   **Aesthetic Reading Layouts**: Features Aeon-style reading grids, reading progress bars, letter drop-caps for article openings, and fully-responsive typography.
*   **Section Categories**: Groups editorial publications into **National** (domestic policy, governance, social justice) and **International** (global diplomacy, geopolitical shifts).

### 📊 4. Admin Dashboard
*   **Real-time Analytics Metrics**: Displays overall publication numbers, subscriber count, and comments posted.
*   **Editorial Overview Panel**: Shows a list of recent submissions with direct links to live pages.
*   **Guidelines System**: Easy-to-follow editorial guidelines directly embedded for editors.

### 💬 5. Engaging Social Interaction
*   **Threaded Discussions**: Custom comment sections for registered readers under each publication.
*   **Moderation Panel**: Allows administrators to delete comments directly from the front-end layout in real-time.
*   **Digital Library & Bookmarks**: Dynamic bookmarking mechanism using optimistic UI updates allowing users to save publications to `/library` under their personal accounts.
*   **Share System**: Responsive popovers supporting sharing to X (Twitter), Facebook, WhatsApp, Email, or clipboard copy.

### 📩 6. Verification & Communication
*   **Secure REST verification API**: Verifies emails using custom REST endpoints that communicate with SMTP relays.
*   **Nodemailer Transporter**: Configured using Gmail API protocols to deliver rich HTML verification templates.
*   **Newsletter Dispatch**: Built-in subscription model inside the footer allowing users to subscribe at **Daily** or **Weekly** intervals.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 16.2.6` (App Router) | React Server Components, server-side layouts, metadata, and dynamic routing. |
| **Core UI Libraries** | `React 19.2.4` / `TypeScript 5` | Component tree and typesafety across client-server borders. |
| **Style System** | `Tailwind CSS v4` | Modern CSS variable styling engine, custom scrollbars, and editorial layout elements. |
| **Animations** | `Framer Motion 12.40.0` | Fluid page transitions, search overlays, and sharing drawer menus. |
| **Icons Library** | `Lucide React 1.16.0` | Clear, scalable vector iconography matching the typography system. |
| **Authentication** | `Firebase Auth` (Client SDK) | Direct reader registration, authentication state listeners, and profile updates. |
| **Database** | `Cloud Firestore` | Distributed document store holding users, articles, comments, bookmarks, and subscribers. |
| **Media Hosting** | `Cloudinary` | Server-signed image uploads for profile pictures and article cover illustrations. |
| **Email Service** | `Nodemailer` + Gmail SMTP | Dynamic HTML verification messages containing auto-expiring tokens. |
| **Deployment Server** | `Vercel` | Serverless environment for Next.js App Router. |

---

## 📐 Architecture & Flows

### 1. Reader Authentication & Registration Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Reader/Admin
    participant UI as Login Page (Client)
    participant API as check-email (Next API)
    participant Auth as Firebase Auth
    participant DB as Cloud Firestore

    User->>UI: Enter Email
    UI->>API: POST /api/check-email {email}
    API->>Auth: adminAuth.getUserByEmail(email)
    alt Email Exists
        API-->>UI: { success: true, exists: true }
        UI->>User: Display Password Field (Sign In)
        User->>UI: Submit Password
        UI->>Auth: signInWithEmailAndPassword()
        Auth-->>UI: UserCredential
    else Email Does Not Exist
        API-->>UI: { success: true, exists: false }
        UI->>User: Display Signup Form (First Name, Last Name, Password)
        User->>UI: Submit Registration
        UI->>Auth: createUserWithEmailAndPassword()
        Auth-->>UI: UserCredential
        UI->>Auth: updateProfile(displayName)
        UI->>DB: setDoc(users/{uid}, { role: "reader", emailVerified: true })
    end
    UI->>DB: getDoc(users/{uid})
    DB-->>UI: Profile Data (Role)
    UI->>User: Redirect to Home (Reader) or /admin (Admin)
```

### 2. Role-Based Access Protection (RBAC) Flow

```mermaid
graph TD
    A[Request Admin Path /admin/*] --> B{Auth Loading?}
    B -- Yes --> C[Show Loading Spinner]
    B -- No --> D{User Authenticated?}
    D -- No --> E[Redirect to /login]
    D -- Yes --> F{User Profile Role == "admin"?}
    F -- No --> G[Redirect to /login & Deny Access]
    F -- Yes --> H[Render AdminLayout & Dashboard Workspace]
    
    style H fill:#9d2b2b,stroke:#fff,stroke-width:2px,color:#fff
    style G fill:#ff4d4d,stroke:#fff,color:#fff
```

### 3. Serverless Verification Engine

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Application
    participant API as API /api/send-verification
    participant Rest as Firestore REST v1
    participant SMTP as Nodemailer (Gmail)

    Client->>API: POST /api/send-verification {email, userId}
    API->>Rest: getDocument("users", userId)
    Rest-->>API: User Profile
    note over API: Security Verification:<br>Checks email match & verified == false
    API->>Rest: setDocument("emailVerifications", token, { expiresAt, used: false })
    API->>SMTP: sendMail(HTML Template with Verification link)
    SMTP-->>Client: Delivery status email
    API-->>Client: { success: true }
```

---

## 📂 Folder Structure

The project uses Next.js App Router architecture organized as follows:

```text
├── cors.json                     # CORS policies for static assets
├── eslint.config.mjs             # Linting parameters
├── firebase.json                 # Firebase deployment configurations
├── firestore.indexes.json        # Custom Firestore query indexes
├── firestore.rules               # Security rules governing DB access
├── next.config.ts                # Next.js configurations
├── package.json                  # Dependencies and execution scripts
├── postcss.config.mjs            # PostCSS plugins
├── tsconfig.json                 # TypeScript rules
├── public/                       # Static assets (images, emblems, logos)
└── src/
    ├── app/                      # Next.js Pages & Routes
    │   ├── globals.css           # Core typography, Tailwind imports & themes
    │   ├── layout.tsx            # Global layout wrapper
    │   ├── loading.tsx           # Global fallback loader
    │   ├── not-found.tsx         # Custom 404 page
    │   ├── robots.ts             # Robots SEO config
    │   ├── sitemap.ts            # Dynamic SEO sitemap generator
    │   │
    │   ├── about/                # Institutional profile pages
    │   ├── national/             # National issues articles index
    │   ├── international/        # Geopolitical articles index
    │   ├── login/                # Joint login/registration portal
    │   ├── signup/               # Redirects to login
    │   ├── library/              # Reader bookmarked publications
    │   ├── profile/              # Account details and password security
    │   │
    │   ├── article/[slug]/       # Long-form article reading layout
    │   │
    │   ├── admin/                # Administrator Panel
    │   │   ├── articles/         # Article list management
    │   │   ├── create/           # Markdown publication publisher
    │   │   ├── edit/[slug]/      # Article editor
    │   │   ├── layout.tsx        # Protected side-nav layout
    │   │   └── page.tsx          # Overview dashboard with metrics
    │   │
    │   └── api/                  # Next.js API Routes
    │       ├── check-email/      # Verifies existing accounts
    │       ├── cloudinary-sign/  # Signs image upload payloads securely
    │       └── send-verification/# Generates Nodemailer SMTP messages
    │
    ├── components/               # Shared Reusable Elements
    │   ├── ArticleActions.tsx    # Share popovers and bookmarking
    │   ├── ArticleCard.tsx       # Reusable layout cards (horizontal/vertical)
    │   ├── BookmarkButton.tsx    # Library bookmark toggle with motion
    │   ├── CommentsSection.tsx   # discussions and moderation triggers
    │   ├── Footer.tsx            # Footer navigation & Newsletter signup
    │   ├── MarkdownEditor.tsx    # Custom text editor pane with helper triggers
    │   ├── Navbar.tsx            # Context-aware header and search engine
    │   ├── PageTransition.tsx    # Transition animations
    │   ├── ReadingProgressBar.tsx# Top screen scroll layout indicator
    │   ├── ShareButtons.tsx      # Social share shortcuts
    │   └── Skeletons.tsx         # Content loading structures
    │
    ├── context/
    │   └── AuthContext.tsx       # Authentication & RBAC Provider
    │
    └── lib/
        ├── db.ts                 # Database CRUD functions & helpers
        ├── firebase.ts           # Firebase client initialize config
        ├── firebase-admin.ts     # Firebase Serverless Admin SDK
        └── firestore-rest.ts     # HTTP REST wrappers for Serverless Firestore
```

---

## 🗄️ Firestore Database Schema

The database uses standard Firestore collection patterns. Structured schemas are documented below:

### 1. `users` Collection
Stores user profiles and permissions. Documents are keyed by the user's Authentication UID.

```typescript
interface UserDocument {
  uid: string;
  firstName: string;
  lastName: string;
  name: string;             // Display name (firstName + lastName)
  email: string;
  role: "admin" | "reader";
  photoURL: string;         // Cloudinary secure link or empty
  createdAt: Timestamp;
  emailVerified: boolean;
}
```

<details>
<summary>View Sample Document</summary>

```json
{
  "uid": "f8Xg7T91s0hD4m2N9pL8zQ5W",
  "firstName": "Alisha",
  "lastName": "Sharma",
  "name": "Alisha Sharma",
  "email": "alisha.sharma@kalindi.du.ac.in",
  "role": "reader",
  "photoURL": "https://res.cloudinary.com/desdc0gbb/image/upload/v17260000/profile.jpg",
  "createdAt": "2026-06-12T16:15:30.000Z",
  "emailVerified": true
}
```
</details>

### 2. `articles` Collection
Stores journal entries, commentaries, and research publications. Keyed by auto-generated IDs.

```typescript
interface ArticleDocument {
  title: string;
  subtitle: string;
  excerpt?: string;
  content: string;          // Rich text / Markdown payload
  authorName: string;
  authorBio: string;
  section: "national" | "international";
  category: string;
  coverImage: string;       // Cloudinary URL or default placeholder SVG
  photoCredit?: string;
  createdAt: Timestamp;
  readingTime: number;      // Calculated in minutes
  featured: boolean;        // If true, highlighted in Hero
  slug: string;             // URL-safe version of title
}
```

<details>
<summary>View Sample Document</summary>

```json
{
  "title": "Decolonizing Global Governance Structures",
  "subtitle": "An analysis of representation deficits in international financial institutions.",
  "excerpt": "This paper evaluates structural inequalities within global governance bodies...",
  "content": "## Introduction\n\nThe post-1945 international order...\n\n> \"Governance must shift from control to coordination.\"",
  "authorName": "Prof. Devika Sen",
  "authorBio": "Visiting Faculty, Department of Political Science",
  "section": "international",
  "category": "Diplomacy",
  "coverImage": "https://res.cloudinary.com/desdc0gbb/image/upload/v17260000/global-governance.webp",
  "photoCredit": "UN Photo/Archives",
  "createdAt": "2026-06-12T10:00:00.000Z",
  "readingTime": 12,
  "featured": true,
  "slug": "decolonizing-global-governance-structures"
}
```
</details>

### 3. `comments` Collection
Stores reader discussions. Keyed by auto-generated IDs. Operates under query indexes.

```typescript
interface CommentDocument {
  articleId: string;        // ID of target article
  userId: string;           // UID of comment author
  userName: string;
  userPhotoURL: string;
  text: string;
  createdAt: Timestamp;
}
```

<details>
<summary>View Sample Document</summary>

```json
{
  "articleId": "art_90123hdsaf",
  "userId": "f8Xg7T91s0hD4m2N9pL8zQ5W",
  "userName": "Alisha Sharma",
  "userPhotoURL": "https://res.cloudinary.com/desdc0gbb/image/upload/v17260000/profile.jpg",
  "text": "Excellent perspective on IMF voting power shares. The historical arguments align perfectly with current reform proposals.",
  "createdAt": "2026-06-12T16:20:00.000Z"
}
```
</details>

### 4. `bookmarks` Collection
Tracks saved articles for the reader's library. Keyed as `${userId}_${articleId}` to prevent duplicates.

```typescript
interface BookmarkDocument {
  userId: string;
  articleId: string;
  articleSlug: string;
  savedAt: Timestamp;
}
```

<details>
<summary>View Sample Document</summary>

```json
{
  "userId": "f8Xg7T91s0hD4m2N9pL8zQ5W",
  "articleId": "art_90123hdsaf",
  "articleSlug": "decolonizing-global-governance-structures",
  "savedAt": "2026-06-12T16:30:00.000Z"
}
```
</details>

### 5. `newsletterSubscribers` Collection
Stores newsletter subscriptions. Keyed by the subscriber's `email` address.

```typescript
interface NewsletterSubscriberDocument {
  email: string;
  subscriptionType: "daily" | "weekly";
  subscribedAt: Timestamp;
}
```

<details>
<summary>View Sample Document</summary>

```json
{
  "email": "reader.yrf@du.ac.in",
  "subscriptionType": "weekly",
  "subscribedAt": "2026-06-12T16:32:00.000Z"
}
```
</details>

### 6. `emailVerifications` Collection
Holds active, expiring authentication verification tokens. Keyed by `token`.

```typescript
interface EmailVerificationDocument {
  token: string;            // UUID v4
  email: string;
  userId: string;
  createdAt: string;        // ISO Date String
  expiresAt: string;        // ISO Date String (createdAt + 15 minutes)
  used: boolean;
}
```

<details>
<summary>View Sample Document</summary>

```json
{
  "token": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "email": "new.member@kalindi.du.ac.in",
  "userId": "z9Yx8W76v5uT4s3R2qP1o0N",
  "createdAt": "2026-06-12T22:00:00.000Z",
  "expiresAt": "2026-06-12T22:15:00.000Z",
  "used": false
}
```
</details>

---

## ⚡ API Documentation

### 1. Check Email Presence
Verify if an email address is already bound to an authentication profile.

*   **Endpoint**: `/api/check-email`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "email": "example@domain.com"
    }
    ```
*   **Response Body (Success - Exists)**:
    ```json
    {
      "success": true,
      "exists": true
    }
    ```
*   **Response Body (Success - New)**:
    ```json
    {
      "success": true,
      "exists": false
    }
    ```
*   **Error Response (Bad Request)**:
    ```json
    {
      "success": false,
      "error": "Email required"
    }
    ```

### 2. Cloudinary Upload Signing
Generate SHA-1 signatures to allow direct, secure file uploads from client layouts without exposing API secrets.

*   **Endpoint**: `/api/cloudinary-sign`
*   **Method**: `POST`
*   **Request Body**: *None*
*   **Response Body (Success)**:
    ```json
    {
      "success": true,
      "signature": "f2ca1bb6c7e907d06dafe4687e5e110bb5120285",
      "timestamp": 1718211024,
      "apiKey": "758598694796377",
      "preset": "youth_research_uploads",
      "cloudName": "desdc0gbb"
    }
    ```
*   **Error Response (Not Configured)**:
    ```json
    {
      "success": false,
      "error": "Cloudinary credentials not configured on the server."
    }
    ```

### 3. Send Account Verification Link
Creates an expiring verification token and delivers an HTML message to the recipient's inbox.

*   **Endpoint**: `/api/send-verification`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "email": "reader@domain.com",
      "userId": "f8Xg7T91s0hD4m2N9pL8zQ5W",
      "name": "Jane Doe"
    }
    ```
*   **Response Body (Success)**:
    ```json
    {
      "success": true
    }
    ```
*   **Error Response (Unauthorized/Invalid)**:
    ```json
    {
      "success": false,
      "error": "Access denied. Email mismatch."
    }
    ```

---

## 💻 Installation & Setup

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm or yarn
*   A Firebase project with Firestore and Authentication enabled
*   A Cloudinary cloud account
*   A Gmail account (or SMTP provider credentials)

### 1. Clone & Install
```bash
git clone https://github.com/Saaras-spec/YouthResearchforum.git
cd YouthResearchforum
npm install
```

### 2. Setup Environment Variables
Create a `.env.local` file in the root directory:

```env
# Firebase Public Web SDK Keys
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary Public Keys
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Server-Side Cloudinary Keys
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Gmail SMTP Keys for Verification Emails
EMAIL_FROM=noreply@youthresearchforum.com
EMAIL_USER=your_gmail_username@gmail.com
EMAIL_PASS=your_gmail_app_password

# Firebase Serverless Admin JSON String
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "your_project_id", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n", "client_email": "...", ...}'
```

---

## 🏃 Development Workflow

To run the Next.js development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the live rendering. Code changes will trigger automatic fast-refresh compiles.

---

## 🚀 Deployment Guide

### Deploying to Vercel (Frontend & Serverless APIs)
1. Install Vercel CLI or link your repository to the **[Vercel Dashboard](https://vercel.com)**.
2. Ensure you add all environment variables defined in `.env.local` to the Vercel project environment configuration console.
3. Build & Deploy:
   ```bash
   vercel
   ```

### Deploying Firestore Rules & Indexes
To deploy Firestore security parameters directly from your local codebase:
1. Initialize firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```
2. Deploy Rules & Custom Indexes:
   ```bash
   firebase deploy --only firestore
   ```

---

## 🔒 Security Implementation

*   **Custom Firestore Rules**: Rules restrict write access of articles strictly to `admin` roles, prevent readers from editing metadata fields like `role` or `emailVerified`, and enforce matching `userId` checks on comments/bookmarks.
*   **Signed Upload Handshakes**: File upload requests to Cloudinary are signed server-side using SHA-1 encryption and custom timestamps, preventing malicious file injections or coordinate spoofing.
*   **Verification Token Expirations**: Verification database entries explicitly expire after 15 minutes and contain a `used` status flag to block token replay attacks.
*   **REST Serverless Fallbacks**: Next.js serverless routes communicate with Firestore database schemas using Google REST protocol APIs instead of node modules, bypass cold-boot latency limits, and operate strictly under Firestore security rules.

---

## 🖼️ Application Layout Mockups

Below are structural blueprints representing the platform's user interface design:

### Public Reading Portal
```text
┌──────────────────────────────────────────────────────────────────────────┐
│  YOUTH RESEARCH FORUM                             [Search] [Login/Sign]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [======================= FEATURED ARTICLE =======================]  │
│  Decolonizing Global Governance Structures                               │
│  An analysis of representation deficits in international institutions... │
│  By Prof. Devika Sen                                                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                     LATEST RESEARCH PUBLICATIONS                         │
│                                                                          │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────┐│
│  │ National Issues       │ │ Geopolitics Today     │ │ Environmental    ││
│  │ Domestic policy...    │ │ Diplomatic shifts... │ │ Climate models...││
│  │ By Alistair Thorne    │ │ By Maya Patel         │ │ By Aaron Vance   ││
│  └───────────────────────┘ └───────────────────────┘ └──────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### Editor-in-Chief Panel
```text
┌──────────────────────────┬───────────────────────────────────────────────┐
│ Administrative           │ Editor Overview                               │
│ Editor Panel             ├───────────────────────────────────────────────┤
│                          │ ARTICLES PUBLISHED   SUBSCRIBERS   COMMENTS   │
│ [Overview]               │        184                892          412    │
│ [All Articles]           ├───────────────────────────────────────────────┤
│ [Create Article]         │ Recent Submissions                 [View All] │
│                          │ • Decolonizing Global Governance ... [Edit]    │
│ [Public Site]            │ • Re-evaluating Meritocracy Trends ... [Edit]   │
│ [Logout]                 │ • Global South Climate Agreements  ... [Edit]    │
└──────────────────────────┴───────────────────────────────────────────────┘
```

---

## 📈 Performance Optimizations

1.  **Server/Client Components**: Heavy markdown processing, sitemaps, and data queries are resolved server-side (`src/app/page.tsx`, `src/app/article/[slug]/page.tsx`), sending zero bundle overhead to the client.
2.  **Asset Compression Hooks**: Integrated with Cloudinary's dynamic CDN transformations for profile pictures and cover art, ensuring optimized webp images are served depending on screen resolution.
3.  **Framer Motion Lazy-Loads**: Transition elements use modular exit/enter properties, avoiding heavy computational threads during route changes.

---

## 🔍 Troubleshooting & Support

### Issue 1: "FirebaseError: Missing or insufficient permissions"
*   **Cause**: This happens when a newly registered reader tries to create or update profile fields protected by security rules, or write to collections without authentication.
*   **Solution**: Ensure that on sign-up, the Firestore document write operation to `users/{uid}` strictly conforms to allowed defaults: `role` must be `"reader"`, `email` must match the auth profile, and `uid` must match the authenticating user.

### Issue 2: Cloudinary Signing Fails
*   **Cause**: `CLOUDINARY_API_KEY` or `CLOUDINARY_API_SECRET` are not set in `.env.local`.
*   **Solution**: Double check credentials inside the Cloudinary console and confirm they are loaded correctly on Vercel or locally.

---

## 🗺️ Roadmap & Future Phases

- [ ] **Search Engine Analytics**: Log search queries to index topics readers are searching for.
- [ ] **Reader Submission Pipeline**: Allow readers to upload drafts for editorial review.
- [ ] **PDF Exporter**: Allow readers to export publications as formatted academic papers.
- [ ] **Podcast Player Integration**: Embed audio discussion players for podcast episodes.

---

## 🤝 Contributing

Contributions are welcomed! If you are a developer looking to improve this publishing platform:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Created and maintained by the Youth Research Forum Collective at Kalindi College, University of Delhi.*
