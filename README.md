# CampusFind — College Lost and Found Portal

> *"Lost something? Let's bring it home."*

An academic web application developed for the **Web Programming** course curriculum. CampusFind demonstrates practical implementation of HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, MongoDB/Mongoose, REST APIs, HTTP methods, and Docker containerization.

---

## 1. Project Overview & Abstract

Campus life involves thousands of daily interactions across lecture halls, libraries, laboratories, cafeterias, and sports facilities. Belongings such as graphing calculators, student ID cards, keys, water bottles, and textbooks are frequently misplaced. 

**CampusFind** is a centralized, role-based lost and found web portal engineered specifically for a college campus. It replaces disjointed campus bulletin boards and chat groups with a structured, verified workflow:

1. **Report Lost Possessions:** Students log lost belongings with location, date, and description.
2. **Report Found Belongings:** Finders report recovered belongings with general descriptions, keeping private identifying details confidential to avoid fraudulent claims.
3. **Search & Filter:** Members search reports by keyword, category, location, and date sorting.
4. **Submit Ownership Claims:** Owners submit claims describing private distinguishing marks.
5. **Administrative Verification & Handover:** Administrators review claims against physical logs, approve/reject claims, prevent conflicting claims, and log physical item handovers.
6. **Syllabus Educational Laboratory:** A dedicated interactive page (`lab-demo.html`) demonstrating core syllabus topics (Callbacks vs. Promises vs. Async/Await, Closures, DOM manipulation & XSS protection, CSS selectors, and Node.js Event Loop).

---

## 2. Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Semantic markup, responsive design system, Fetch API, safe DOM manipulation (No frontend framework). |
| **Backend** | Node.js (v20+), Express.js (v4.21+) | RESTful routing, MVC controller architecture, centralized error handling, ES modules (`import`/`export`). |
| **Database** | MongoDB & Mongoose (v8.12+) | Document schemas, validation, text indexes, references, and atomic state updates. Embedded in-memory MongoDB fallback for zero-config evaluation. |
| **Security** | bcryptjs, jsonwebtoken, cookie-parser, helmet | Password hashing, HttpOnly JWT cookies, RBAC authorization, XSS mitigation, input validation. |
| **Containerization** | Docker, Docker Compose | Multi-container setup with Node.js LTS and MongoDB 6.0 service with persistent volume. |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) | 11 automated test assertions for auth, RBAC, CRUD, and claim conflict resolution. |

---

## 3. Project Directory Structure

```text
d:/web_assignment/
├── config/
│   └── db.js                        # MongoDB Mongoose connection & in-memory fallback
├── controllers/
│   ├── adminController.js           # Admin stats, item management, claim review
│   ├── authController.js            # Register (student role), login, logout, me
│   ├── claimController.js           # Claim submission, user claim history
│   └── itemController.js            # Item CRUD, filtering, search, stats
├── middleware/
│   ├── authMiddleware.js            # JWT verification & role-based access control (RBAC)
│   └── errorMiddleware.js           # 404 handler & centralized error responses
├── models/
│   ├── Claim.js                     # Claim schema, indexes, references
│   ├── Item.js                      # Item schema, text search index, status enum
│   └── User.js                      # User schema with bcrypt password hashing
├── public/
│   ├── css/
│   │   ├── admin.css                # Admin dashboard & claim review styling
│   │   ├── forms.css                # Form controls, validation states, radio cards
│   │   └── style.css                # Design system tokens, navigation, cards, toasts
│   ├── js/
│   │   ├── admin.js                 # Admin dashboard metrics, table, review modal
│   │   ├── api.js                   # Centralized Fetch API client wrapper
│   │   ├── auth.js                  # Login/register handling & demo auto-fill helpers
│   │   ├── claim.js                 # Claim submission form handler
│   │   ├── item-details.js          # Item detail viewer & claim CTA trigger
│   │   ├── items.js                 # Item card renderer, query builder & empty states
│   │   ├── lab-demo.js              # Interactive syllabus lab demonstrations
│   │   ├── main.js                  # Global navbar auth state, shortcuts, toast alerts
│   │   └── report.js                # Report submission with character count & preview
│   ├── admin.html                   # Administrative dashboard
│   ├── claim.html                   # Submit ownership claim
│   ├── found-items.html             # Found belongings directory
│   ├── help-embed.html              # Local guide for iframe demonstration
│   ├── index.html                   # Home page with hero, search, live stats
│   ├── item-details.html            # Individual item detail page
│   ├── lab-demo.html                # Web Programming syllabus concepts demonstration
│   ├── login.html                   # Authentication login
│   ├── lost-items.html              # Lost belongings directory
│   └── register.html                # Student account registration
├── routes/
│   ├── adminRoutes.js               # Protected /api/admin endpoints
│   ├── authRoutes.js                # /api/auth registration and session routes
│   ├── claimRoutes.js               # /api/claims routes
│   └── itemRoutes.js                # /api/items CRUD & nested claim route
├── scripts/
│   ├── event-loop-demo.js           # Standalone educational Node.js Event Loop script
│   └── seed.js                      # Database seeding script with realistic reports
├── tests/
│   └── api.test.js                  # Automated test suite (11 unit & integration tests)
├── utils/
│   └── validators.js                # Reusable input validation rules
├── .dockerignore
├── .env                             # Local environment variables
├── .env.example                     # Documented configuration template
├── .gitignore
├── campusfind.postman_collection.json # Postman API test collection
├── docker-compose.yml               # Multi-container Compose configuration
├── Dockerfile                       # Multi-stage production container build
├── package.json
└── README.md
```

---

## 4. Database Schema Design (MongoDB & Mongoose)

The application uses three primary collections:

### 1. `users` Collection (`models/User.js`)
* `name`: String, required, 2–50 characters.
* `email`: String, required, unique, lowercase, validated format.
* `passwordHash`: String, bcrypt hash (salt rounds: 10). Never returned in JSON output.
* `role`: String, enum `['student', 'admin']`. Public registration strictly defaults to `'student'`.
* `timestamps`: `createdAt`, `updatedAt`.

### 2. `items` Collection (`models/Item.js`)
* `itemName`: String, required, 3–100 characters.
* `type`: String, enum `['lost', 'found']`.
* `category`: String, enum: *Electronics, ID Cards, Books and Stationery, Bags and Wallets, Clothing, Keys, Accessories, Other*.
* `description`: String, required, 10–2000 characters.
* `location`: String, required, campus landmark or room.
* `incidentDate`: Date, required, validated to not be in the future.
* `imageUrl`: String, optional web URL with fallback placeholder.
* `contactEmail`: String, optional reporter email.
* `privateDetails`: String, confidential verification notes (visible only to reporter and admin).
* `owner`: ObjectId reference to `User`.
* `status`: String, enum `['open', 'claimed', 'returned']`, default `'open'`.
* `resolvedClaim`: ObjectId reference to `Claim`.
* `resolvedAt`: Date of handover.
* **Indexes:** Compound index on `{ type: 1, status: 1, createdAt: -1 }`, and text index on `{ itemName: 'text', description: 'text', location: 'text' }`.

### 3. `claims` Collection (`models/Claim.js`)
* `item`: ObjectId reference to `Item`.
* `claimant`: ObjectId reference to `User`.
* `explanation`: String, required, minimum 10 characters.
* `identifyingDetails`: String, optional confidential distinguishing marks.
* `contactPhone`: String, optional phone number for security dispatch.
* `status`: String, enum `['pending', 'approved', 'rejected']`, default `'pending'`.
* `reviewedBy`: ObjectId reference to `User` (administrator).
* `reviewedAt`: Date of evaluation.
* `reviewNotes`: String, administrative audit comments.
* **Indexes:** Compound index on `{ item: 1, claimant: 1, status: 1 }`.

---

## 5. REST API Specification

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a student account (role strictly `'student'`). | 201, 400, 409 |
| `POST` | `/api/auth/login` | Public | Authenticate user, set HttpOnly cookie, return token. | 200, 400, 401 |
| `POST` | `/api/auth/logout` | Public | Clear session cookie. | 200 |
| `GET` | `/api/auth/me` | Authenticated | Return profile of currently signed-in user. | 200, 401 |

### Items (`/api/items`)
| Method | Endpoint | Access | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/items` | Public | Filter reports by type, category, location, search keyword, and pagination. | 200 |
| `GET` | `/api/items/:id` | Public | Retrieve single report (includes `privateDetails` only if owner or admin). | 200, 404 |
| `POST` | `/api/items` | Authenticated | Create a new lost or found item report. | 201, 400, 401 |
| `PATCH` | `/api/items/:id` | Owner / Admin | Update report details. Unauthorized users are blocked. | 200, 403, 404 |
| `DELETE` | `/api/items/:id` | Owner / Admin | Delete report and cascade-remove associated claims. | 200, 403, 404 |
| `POST` | `/api/items/:id/claims` | Authenticated | Submit an ownership claim for a found item. | 201, 400, 409 |

### Public Statistics (`/api/stats`)
| Method | Endpoint | Access | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/stats` | Public | Aggregated counts of total, open, returned, and lost/found reports. | 200 |

### Administration (`/api/admin`) — *Requires `role === 'admin'`*
| Method | Endpoint | Access | Description | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin Only | Full database counts including user totals. | 200, 403 |
| `GET` | `/api/admin/items` | Admin Only | Administrative item view including confidential verification details. | 200, 403 |
| `PATCH` | `/api/admin/items/:id/status` | Admin Only | Change status (`open`, `claimed`, `returned`). | 200, 400, 403 |
| `DELETE` | `/api/admin/items/:id` | Admin Only | Force delete any report. | 200, 403 |
| `GET` | `/api/admin/claims` | Admin Only | Retrieve all claims across all found items. | 200, 403 |
| `PATCH` | `/api/admin/claims/:id` | Admin Only | Approve or reject claim. Approving automatically rejects conflicting pending claims. | 200, 400, 409 |

---

## 6. Installation & Execution Instructions

### Prerequisites
* **Node.js** (v18.0.0 or higher; v24 is installed and verified)
* **npm** (v9.0.0 or higher)
* Optional: **Docker** and **Docker Compose**

### Step 1: Clone or Navigate to the Project Root
```bash
cd d:/web_assignment
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` (a ready-to-run `.env` is already configured in the repository):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/campusfind
JWT_SECRET=<your_secure_jwt_secret>
JWT_EXPIRES_IN=7d
INITIAL_ADMIN_NAME="Campus Administrator"
INITIAL_ADMIN_EMAIL=admin@campusfind.edu
INITIAL_ADMIN_PASSWORD=<your_admin_password>
```

> **Zero-Configuration MongoDB Support:** If a local standalone MongoDB service is not running on port 27017, the application automatically boots an embedded **in-memory MongoDB server** (`mongodb-memory-server`) during development, enabling full testing and viva demonstrations without installing external database software.

### Step 4: Run the Application Locally
```bash
# Start server in production mode
npm start

# OR start with Nodemon for active development
npm run dev
```

Visit the application in your browser:
* **Web Portal Interface:** [http://localhost:5000](http://localhost:5000)
* **REST API Endpoint:** [http://localhost:5000/api](http://localhost:5000/api)
* **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 7. Pre-Configured Demo Credentials

For academic grading and live viva demonstrations, quick-fill buttons are provided on the Login page:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Administrator** | `admin@campusfind.edu` | *(Set via INITIAL_ADMIN_PASSWORD)* | Access Admin Dashboard, review claims, approve/reject claims, delete reports, update item statuses. |
| **Student** | `alex.student@campusfind.edu` | `StudentPass123!` | Report lost items, report found items, submit ownership claims, view claim history. |

---

## 8. Docker & Docker Compose Execution

To build and run the multi-container application (Node.js app + MongoDB container with named persistent volume):

```bash
# 1. Build and start containers in detached mode
docker-compose up --build -d

# 2. View streaming logs from both services
docker-compose logs -f

# 3. Stop containers while preserving database volume
docker-compose down

# 4. Stop containers and reset database volume
docker-compose down -v
```

---

## 9. Netlify Deployment Guide

CampusFind is configured to deploy seamlessly to **Netlify** using **Netlify Serverless Functions** and Netlify Static Hosting.

### Architecture on Netlify
* **Static Assets**: All HTML, CSS, client-side JS, and media in `/public` are served directly through Netlify's high-speed global CDN.
* **Backend API**: The Express.js backend runs as an AWS Lambda serverless function via `serverless-http` at `netlify/functions/api.js`.
* **Routing**: Netlify rewrites all `/api/*` requests directly to `/.netlify/functions/api/*` via [`netlify.toml`](file:///d:/web_assignment/netlify.toml).

### Prerequisites for Netlify Deployment
Because Netlify serverless functions run ephemerally in the cloud, you need a free cloud MongoDB database:
1. Create a free **MongoDB Atlas** account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free M0 Shared Cluster (e.g., `campusfind`).
3. Under **Database Access**, create a user (e.g. `campusadmin`) and password.
4. Under **Network Access**, add IP address `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** > **Drivers** > copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/campusfind?retryWrites=true&w=majority
   ```

### Method 1: Deploy via GitHub (Recommended)
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Netlify](https://app.netlify.com) and click **"Add new site"** > **"Import an existing project"**.
3. Select your repository. Netlify will automatically detect settings from [`netlify.toml`](file:///d:/web_assignment/netlify.toml):
   * **Publish directory**: `public`
   * **Functions directory**: `netlify/functions`
4. Under **Site configuration** > **Environment variables**, add:
   * `NODE_ENV` = `production`
   * `MONGODB_URI` = *(Your MongoDB Atlas connection string from above)*
   * `JWT_SECRET` = *(Generate any secure random string)*
   * `JWT_EXPIRES_IN` = `7d`
   * `INITIAL_ADMIN_NAME` = `Campus Administrator`
   * `INITIAL_ADMIN_EMAIL` = `admin@campusfind.edu`
   * `INITIAL_ADMIN_PASSWORD` = *(Your chosen secure admin password)*
5. Click **Deploy Site**. Netlify will build the function, publish the frontend, and give you a live URL (`https://your-app.netlify.app`).

### Method 2: Deploy via Netlify CLI
```bash
# 1. Install Netlify CLI globally if needed
npm install -g netlify-cli

# 2. Login to your Netlify account
netlify login

# 3. Initialize and deploy
netlify init

# 4. Set environment variables
netlify env:set MONGODB_URI "your_mongodb_atlas_connection_string"
netlify env:set JWT_SECRET "campusfind_prod_secret_2025"
netlify env:set NODE_ENV "production"

# 5. Deploy to production
netlify deploy --prod
```

---

## 10. Automated Testing & Verification

Run the automated test suite executing 11 integration tests covering authentication, RBAC, input validation, CRUD operations, and atomic claim conflict resolution:

```bash
npm test
```

### Test Results Summary:
* `Setup: Connect to Database` — PASS
* `1. User Registration: Creates student account with hashed password` — PASS
* `2. User Registration: Duplicate email rejected by MongoDB unique constraint` — PASS
* `3. Role Escalation Protection: Public creation cannot bypass role` — PASS
* `4. Item CRUD: Create Lost Report and Found Report` — PASS
* `5. Item Search & Filtering (category, text matching)` — PASS
* `6. Ownership Claims: Submit valid claim for found item` — PASS
* `7. Conflict Prevention: Approving claim updates item and rejects conflicting claims` — PASS
* `8. Handover Resolution: Mark item returned with timestamp` — PASS
* **Result:** `11 passed, 0 failed, 100% success rate`.

---

## 10. Web Programming Syllabus Mapping

The project maps directly to university Web Programming syllabus units:

| Syllabus Concept | Implementation Location | Demonstration Description |
|---|---|---|
| **Semantic HTML5** | `public/index.html`, `public/lab-demo.html` | `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<mark>`, `<dl>`, `<dd>`. |
| **HTML Tables & Lists** | `public/admin.html`, `public/lab-demo.html` | Semantic tables with `<thead>`, `<tbody>`, `<th>`, `<td>`; ordered, unordered, and description lists. |
| **HTML Forms & Inputs** | `public/report.html`, `public/claim.html` | Form controls: `text`, `email`, `date`, `radio`, `textarea`, `url`, client validation attributes. |
| **HTML iframe** | `public/lab-demo.html`, `public/help-embed.html` | Local security guidelines document embedded with accessible `title` and `sandbox` attributes. |
| **CSS3 Selectors & Hierarchy** | `public/css/style.css`, `public/lab-demo.html` | Element, class, ID, attribute (`[type="..."]`), and pseudo-classes (`:hover`, `:focus-visible`). |
| **Internal vs External CSS** | `public/lab-demo.html` (lines 14–40) | Contrast between `<style>` tag in head and linked stylesheets (`<link rel="stylesheet">`). |
| **CSS Box Model, Flexbox & Grid** | `public/css/style.css`, `public/css/forms.css` | Grid-based item listings (`grid-template-columns`), flexbox navigation and cards. |
| **Variables & Data Types** | `public/js/main.js`, `public/js/lab-demo.js` | ES6 `const`, `let`, objects, arrays, strings, booleans, dates. |
| **Functions & Scope** | `public/js/main.js`, `public/js/lab-demo.js` | Arrow functions, pure functions, global, function, and block scope. |
| **Closures** | `public/js/lab-demo.js` (lines 115–155) | Independent counter factory function maintaining private state in lexical scope. |
| **Asynchronous JS & Callbacks** | `public/js/lab-demo.js` (lines 20–110) | Interactive step-by-step comparison: Callbacks (Pyramid of Doom) vs. Promises vs. `async/await`. |
| **DOM Manipulation & XSS** | `public/js/lab-demo.js` (lines 160–205) | Live comparison of vulnerable `innerHTML` vs. safe `textContent` / `createElement`. |
| **Event Listeners** | `public/js/main.js`, `public/js/lab-demo.js` | `addEventListener()` for `click`, `submit`, `input`, `change`, `keydown` (global `/` search shortcut). |
| **Node.js Event Loop & Non-Blocking I/O** | `scripts/event-loop-demo.js`, `public/lab-demo.html` | Educational demonstration of Call Stack, Microtasks (`process.nextTick`, `Promise`), and Macrotasks (`setTimeout`, async I/O). |
| **Express Middleware & Routing** | `server.js`, `routes/`, `middleware/` | JSON parser, CORS, security headers (`helmet`), cookie-parser, logger (`morgan`), auth guard, error handler. |
| **MongoDB & Mongoose CRUD** | `models/`, `controllers/` | Full **C**reate, **R**ead, **U**pdate, **D**elete persistence with schema validation and text indexing. |
| **REST APIs & HTTP Status Codes** | `routes/`, `controllers/` | Proper usage of `GET` (200), `POST` (201), `PATCH` (200), `DELETE` (200), 400, 401, 403, 404, 409, 422. |
| **Containerization** | `Dockerfile`, `docker-compose.yml` | Multi-container Docker deployment with networking and persistent volumes. |

---

## 11. Known Limitations & Future Enhancements

* **Image Uploads:** Currently supports direct HTTP/HTTPS image URLs. Future versions can incorporate `multer` and Cloudinary for local multi-part file uploads.
* **Email Notifications:** Handled through `mailto:` triggers and in-app status updates. An integration with Nodemailer / SMTP can provide automated notifications when a claim is approved.
* **Geographical Campus Map:** An interactive Leaflet.js campus map can visually pin locations where items were found.
