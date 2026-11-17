# Security Specification & Invariants

## 1. Data Invariants
1. **PII Isolation**: Public schedule availability (`/schedule_slots`) contains zero customer PII (only `date`, `slotKey`, `status`, and opaque `appointmentId` reference). Customer PII (`clientName`, `clientEmail`, `clientPhone`, `serviceAddress`) in `/appointments` and `/estimates` is readable ONLY by the authenticated owner (`userId == request.auth.uid`) or a verified Handyman Admin (`isAdmin()`).
2. **Atomic Slot Locking (`existsAfter`)**: Creating a public `booked` entry in `/schedule_slots/{slotId}` requires an atomic batch write that simultaneously creates `/appointments/{appointmentId}` and enforces `slotId == date + '_' + slotKey`. Existing slots cannot be overwritten by non-admins.
3. **Immutable Ownership & Timestamps**: On `create`, `createdAt == request.time` and `updatedAt == request.time`, initial status must be `'pending'` (appointments) or `'requested'` (estimates), and `userId` must equal `request.auth.uid` (when signed in) or `'guest'` (when unauthenticated guest submission). On `update`, `createdAt` and `userId` are strictly immutable.
4. **Role Escalation Prevention**: Only verified admin emails (`spirosvelianitis@gmail.com` with `email_verified == true`) or existing `/admins/{uid}` documents hold `isAdmin()`. Users cannot self-assign admin status.
5. **Strict Key & Size Enforcement**: Every write checks `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, and `.size()` bounds on every string.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. **Public PII Scrape**: Unauthenticated `list` or `get` on `/appointments` or `/estimates`.
2. **Cross-User Read**: Authenticated user A reading user B's `/appointments/{id}`.
3. **Shadow Field Injection**: Creating an appointment with extra field `isAdminApproved: true`.
4. **Status Shortcutting**: Creating an appointment with `status: 'confirmed'` or estimate with `formalQuoteAmount: 1`.
5. **Slot Hijack**: Overwriting an existing `/schedule_slots/2026-11-20_morning` doc via update or create.
6. **Orphan Slot Lock**: Creating `/schedule_slots/{slotId}` with `status: 'booked'` without creating a matching `/appointments/{appointmentId}` in the same batch.
7. **Unauthorized Block**: Non-admin creating `/schedule_slots/{slotId}` with `status: 'blocked'`.
8. **ID Poisoning**: Creating `/appointments/<150-char-invalid-id>` or special characters.
9. **Denial of Wallet String**: Submitting a 10KB `description` on `/appointments` or `/estimates`.
10. **Timestamp Forgery**: Creating `/appointments` with backdated `createdAt`.
11. **Role Self-Elevation**: Authenticated client creating `/admins/{uid}` with `role: 'owner'`.
12. **Terminal State Bypass**: Client updating an already `'cancelled'` or `'completed'` appointment back to `'confirmed'`.
