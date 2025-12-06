# Invertishub — Backend Technical Report

This file contains a complete, human-readable technical report for the backend in this repository. It documents architecture, all API endpoints, an authentication & security audit, database analysis, code-quality findings, performance observations, missing improvements, prioritized fixes and a next-steps roadmap.

If you want this exported to OpenAPI/Swagger or saved as a separate report file, tell me and I will add it.

---

## Quick summary

- Stack: Node.js, Express, MongoDB (Mongoose), Cloudinary (media), Nodemailer (email).
- Architecture: layered (routes → controllers → services/models). Controllers perform business logic and call models & services.
- Auth: cookie-based JWT (critical bug: tokens decoded but not verified — see Security section).

Score (current): **52 / 100** — good structure and features, but critical security and correctness issues must be fixed to be production-ready.

---

## 1) Folder structure & architecture

- `server.js` — starts the server and connects to the DB.
- `src/app.js` — wires express middleware, CORS, helmet and mounts route groups.
- `src/routes/` — express Router files grouped by feature: e.g. `user`, `post`, `comment`, `cloud`.
- `src/controllers/` — request handlers implementing business logic for each feature.
- `src/models/` — Mongoose schemas and models for persistence.
- `src/middlewares/` — auth middleware and validation helper.
- `src/services/` — external integrations (email sending).
- `src/utils/` — token generation, hashing, OTP generator.

Pattern detected: layered MVC / service-based architecture. Routes are thin; controllers perform orchestration and call models & services. It's a maintainable approach, but controllers sometimes contain complex mapping logic that would be cleaner in dedicated service classes.

---

## 2) Full API endpoint documentation

All routes are mounted under `/api` (see `src/app.js`). Below is a complete mapping of endpoints found in `src/routes`.

Note: controller-level validation is sometimes missing; see Missing Improvements.

Endpoints (method — full path)

- POST `/api/users/register`

  - Controller: `registerUser`
  - Middleware: `registerValidation`, `validation`
  - Body: `{ user: { fullName, email, password }, username }`
  - Success: 201, message and user summary, sets `token` cookie (7d)
  - Errors: 409 user exists, 400 validation, 500 server error

- POST `/api/users/verified-user`

  - Controller: `verifiedUser`
  - Body: `{ email, otp }` (otp expected as array that is `join`ed)
  - Success: 201 account verified
  - Errors: 404 user not found, 400 otp expired/invalid, 500

- POST `/api/users/login`

  - Controller: `loginUser`
  - Body: `{ email, password }`
  - Success: 200 user object, sets `token` cookie (1h)
  - Errors: 404 invalid, 400 not verified, 500

- POST `/api/users/forget-password`

  - Controller: `forgetPassword`
  - Body: `{ email }`
  - Success: 200 otp sent
  - Errors: 404 user not found

- POST `/api/users/verify-forget-otp`

  - Controller: `verifyForgetOtp`
  - Body: `{ email, otp }`
  - Success: 200 otp verified
  - Errors: 404 user, 400 expired/invalid

- POST `/api/users/update-new-password`

  - Controller: `updateNewPassword`
  - Body: `{ email, password }`
  - Success: 200 password changed
  - Errors: 404 user, 404 not verified via OTP

- POST `/api/users/logout`

  - Controller: `logout`
  - Middleware: `authUser`
  - Success: clears `token` cookie

- POST `/api/users/check-username`

  - Controller: `findUserName`
  - Body: `{ username }`
  - Success: 200 isAvailable true/false

- POST `/api/users/update-user-profile`

  - Controller: `updateProfile`
  - Middleware: `authUser`
  - Body: `{ data: { bio, phone, username, fullName }, publicId }`
  - Success: 200 profile updated
  - Errors: 400 invalid user, 404 profile not found, 500 on cloud/db errors

- POST `/api/users/get-user-profile`

  - Controller: `getUserProfile`
  - Middleware: `authUser`
  - Body: none (reads from cookie)
  - Success: 200 user profile object

- POST `/api/cloud/genrateSignature`

  - Controller: `getSignature`
  - Middleware: `authUser`
  - Returns: timestamp, signature, folder, cloudName, apiKey

- GET `/api/cloud/media`

  - Controller: `getMediaById`
  - Middleware: `authUser`
  - Returns: signed URL object(s)

- POST `/api/post/create-post`

  - Controller: `createPost`
  - Middleware: `authUser`
  - Body: `{ caption, publicId }`
  - Success: 200 saved post

- GET `/api/post/get-post?limit=&page=`

  - Controller: `getPost`
  - Middleware: `authUser`
  - Query: `limit` (default 10), `page` (default 0)
  - Success: 200 list of posts + questions (combined feed)
  - Note: feed assembly contains logic bugs; see Code Quality.

- POST `/api/question/create-question`

  - Controller: `createQuestion`
  - Middleware: `authUser`
  - Body: `{ title, description, tags }`

- POST `/api/follow-unfollow/follow`

  - Controller: `follow`
  - Middleware: `authUser`
  - Body: `{ followId }`

- POST `/api/follow-unfollow/unfollow`

  - Controller: `unfollow`
  - Middleware: `authUser`
  - Body: `{ unfollowId }`

- POST `/api/toggle-like/like`

  - Controller: `liked`
  - Middleware: `authUser`
  - Body: `{ itemId, itemType }` (itemType in `post|answer|question`)

- POST `/api/toggle-like/dislike`

  - Controller: `disliked`
  - Middleware: `authUser`

- POST `/api/comment/create-comment`

  - Controller: `addComment`
  - Middleware: `authUser`
  - Body: `{ postId, comment }`

- POST `/api/comment/delete-comment`

  - Controller: `deleteComment`
  - Middleware: `authUser`
  - Body: `{ commentId }`

- POST `/api/save-item/toggle-saved-item`

  - Controller: `tooggleSavedItem`
  - Middleware: `authUser`
  - Body: `{ itemId, itemType }`

- POST `/api/report/make-report`
  - Controller: `addReport`
  - Middleware: `authUser`
  - Body: `{ postId, reason }`

---

## 3) Authentication & security audit (critical)

- Current flow: JWT token created with `jwt.sign(payload, secret, { expiresIn: '1h' })` and stored as a cookie named `token`.
- Critical bug: token verification uses `jwt.decode(token, secret)` which only decodes and DOES NOT verify signature or expiration. This allows forging tokens. Replace with `jwt.verify(token, secret)` immediately.
- `authUser` middleware has a catch block referencing `err` while the catch variable is `error` — this will throw a reference error and break auth error handling.
- Cookies: they are set with `httpOnly` and conditional `secure`. Confirm `sameSite` and `secure` settings for production; use `SameSite=None` with `secure` when cross-site cookies are required.
- Sensitive values are logged (e.g., `console.log(process.env.GOOGLE_APP_USER)`); remove such logs.
- No rate limiting or brute-force protection on auth endpoints — add `express-rate-limit` for `/login`, `/register`, OTP endpoints.
- No CSRF protections for cookie-based flows — consider adding CSRF tokens or using SameSite + secure cookies depending on client setup.

Recommendations (prioritized):

1. Immediately change `verifyToken` to use `jwt.verify` and update `authUser` catch to handle `TokenExpiredError` and `JsonWebTokenError`.
2. Remove sensitive env logs and avoid sending secrets to clients.
3. Add `express-rate-limit` to auth routes and global limiter as needed.
4. Add input validation and sanitization for all endpoints.
5. Add centralized error handler to avoid leaking server errors to clients.

---

## 4) Database analysis

- Database: MongoDB via Mongoose (models under `src/models/user/`).

Models found:

- `User` — fields: FullName, userName (unique), email (unique), password, otp, otpExpire, isVerified, tempUser, forgetOtpVerify.
- `Profile` — stores profile-level counts and profileImageId (used in controllers).
- `Post` — userId (ref User), postUrl (Cloudinary public id), caption, likedCount, dislikedCount, commentCount.
- `Question` — userId, questionTitle, questionDescription, questionTags, likedCount, dislikedCount.
- `Comment` — userId, postId (ref Post), comment.
- `Like` / `Disliked` — userId, itemId, itemType (enum: post|answer|question).
- `SavedItem` — userId, itemId, itemType (note: file uses `moongoose` typo).
- `FollowUnfollow` — followerId, followingId.
- `Answer` — userId, questionId, answer.
- `Report` — userId, postId, reason.

Relations and indexes:

- Relations are implemented with ObjectId refs and resolved manually. Few controllers use `populate` — many use separate queries and manual mapping.
- Recommended indexes to add:
  - Compound unique index on likes/dislikes/saved items: `{ userId:1, itemId:1, itemType:1 }` to prevent duplicates.
  - Index on `post.createdAt` and `post.userId` for feed queries.
  - Index on `profile.profileId` for fast lookups.
  - Index on `followUnfollow` compound `{ followerId, followingId }` for fast checks.

Potential issues:

- `savedItem.model.js` contains a misspelling `moongoose` — fix to `mongoose` to avoid runtime errors.
- Some counters are updated across multiple documents without transactions; this can cause inconsistent state if one update fails. Use transactions (replica set) or a queue for eventual consistency.

---

## 5) Code quality report

Findings:

- Duplicate logic: toggle-like/dislike/saved follow a repeated pattern — can be consolidated into shared utility/service.
- Repeated increments/decrements of counters across controllers — centralize counter update logic.
- Several controllers mix concerns (DB queries + cloud operations + response shaping). Consider separating into `Service` layer.
- Error handling inconsistent: some controllers return `success` flags, others do not; some catch blocks return 200 on error — fix to consistent HTTP status codes.
- Async usage generally correct, but some Promise.all / mapping relies on index-based matching which is fragile.
- `post.controller.getPost` has multiple logic bugs:
  - `profileMap` keys by `profileImageId` instead of `profileId`.
  - `userMap` created as array; then code uses `userMap[0]` for all posts.
  - `getMediaById` is called with incorrect types (object instead of array/ids).

Recommendations:

- Refactor controllers to use small services (e.g., `PostService`, `FeedService`, `UserService`).
- Add a response serializer to standardize API outputs.
- Add tests around critical flows (auth, create post, feed, like toggle).
- Fix the `post.controller` logic to build proper maps and sign images per-item.

---

## 6) Performance review

Problems and slow operations:

- Pagination uses `skip` which is slow for high offsets; switch to cursor-based pagination (use `_id` or `createdAt` with range queries).
- Feed assembly runs multiple queries and signs Cloudinary URLs per request. Signing every image is expensive — cache signed URLs in Redis for their TTL (e.g., 30 minutes).
- `Post.find()` is called without filters in some flows — ensure queries limit fields returned and use indexes.

Heavy queries / N+1:

- Users + profiles fetched separately after feed query — use aggregation pipeline or `populate` to reduce queries and avoid N+1.

Recommendations:

- Introduce Redis cache for signed URLs and popular feed pages.
- Use aggregation pipelines for feed assembly or create a denormalized view for feed entries.
- Use cursor-based pagination for feed endpoints.
- Add monitoring for slow queries (APM or MongoDB profiler).

---

## 7) Missing improvements checklist

- Validation: missing or inconsistent. Use `zod`, `joi` or `express-validator` centrally for all endpoints.
- Rate limiting: missing. Add `express-rate-limit` and consider IP & user-based limits on sensitive endpoints.
- Centralized error handler: missing — add an Express error middleware to normalize errors.
- Pagination: cursor-based missing — replace `skip` with cursor.
- Logging & monitoring: minimal. Add `pino`/`winston` and integrate Sentry or similar for errors.
- Tests: none present. Add unit & integration tests.

---

## 8) Final deliverables & prioritized roadmap

Deliverables included here:

- Full API documentation (section 2 above).
- Architecture explanation (section 1).
- Security & DB analysis (sections 3 and 4).

Prioritized immediate fixes (blockers) — do these first:

1. Fix JWT verification: use `jwt.verify` in `src/utils/genrateToken.js` and update `authUser` error handling (`err` → `error`).
2. Fix `src/models/user/savedItem.model.js` `moongoose` typo.
3. Remove `console.log` of env/secrets (e.g., `email.services.js`).
4. Add rate limiting for `/login`, `/register`, OTP and `/report` endpoints.

Short-term improvements (next sprint):

- Add validation for all routes and a centralized error handler.
- Fix feed logic and add cursor-based pagination.
- Add indexes and unique compound indexes for like/saved operations.
- Cache Cloudinary signed URLs and heavy feed responses in Redis.

Mid/long-term (stability and scale):

- Add tests and CI.
- Migrate critical counter updates to transactions or event-driven updates.
- Harden auth with refresh tokens (if required) and CSRF protection for cookies.

Score recap: **52/100** (structural + features present; critical security & correctness issues prevent production readiness).

---

## Quick fixes I can apply now (choose one)

- Apply code patches for critical fixes (JWT verify, middleware error handling, savedItem typo).
- Generate an OpenAPI (Swagger) JSON for these endpoints.
- Create a small Redis-caching example for `getMediaById`.

Tell me which follow-up you'd like and I'll implement it. If you want, I can apply the three critical code fixes now and run a quick lint/static check.

---

Appendix: file locations referenced in this report

- `src/utils/genrateToken.js` — token generation and verification
- `src/middlewares/user.middleware.js` — auth middleware
- `src/controllers/user/*.js` — controllers for features
- `src/models/user/*.js` — Mongoose models

Feedback welcome — I can also export this report to `backend/TECHNICAL_REPORT.md` or generate an interactive Swagger UI.
