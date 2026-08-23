# Authentication and Security

## 1. Roles

Checkpoint has two roles:

```text
STUDENT
ADMIN
```

There is exactly one administrator in V1.

---

## 2. Student registration

Registration is public.

The user provides:

- username;
- email;
- password.

The backend always assigns:

```text
STUDENT
```

The role is not accepted from the registration request.

This is important because authorization must never depend on a client-controlled value.

---

## 3. Administrator

The administrator is configured outside the application database signup flow.

For example:

```text
CHECKPOINT_ADMIN_USERNAME
CHECKPOINT_ADMIN_PASSWORD_HASH
```

The actual values are supplied through secure environment configuration.

The administrator is never created by:

```text
POST /api/auth/register
```

---

## 4. Passwords

Student passwords are hashed with BCrypt.

The database stores:

```text
password_hash
```

not the original password.

Even administrators should not have a plaintext password committed to source control.

---

## 5. JWT

After successful authentication, the backend issues a JWT access token.

The token contains only information required for authentication/authorization, such as:

- subject;
- role;
- issued-at;
- expiration.

V1 uses a 24-hour access-token lifetime.

Refresh tokens are intentionally excluded from V1 to keep the authentication system manageable.

---

## 6. Frontend token storage

V1 uses `sessionStorage`.

This means the token remains available during the browser session but is removed when the session ends.

A future hardened production architecture can move to secure HTTP-only cookies.

---

## 7. Authorization

The flow is:

```text
Request
  ↓
JWT validation
  ↓
Authenticated identity
  ↓
Role check
  ↓
Controller
  ↓
Service
  ↓
Database
```

A student attempting an admin endpoint receives:

```text
403 Forbidden
```

A request without valid authentication receives:

```text
401 Unauthorized
```

---

## 8. Ownership checks

Authentication alone is not enough.

Suppose Student A is authenticated.

They should not be able to request:

```text
/progress/student-B
```

and receive Student B's information.

The service layer must always verify ownership.

---

## 9. Common attacks we should prevent

### Privilege escalation

Never accept a role from registration.

### IDOR / unauthorized object access

Always verify that the requested resource belongs to the authenticated user.

### XP manipulation

Calculate XP on the backend.

### Answer manipulation

Determine correctness on the backend.

### Password exposure

Never return password hashes.

### Secret leakage

Keep credentials outside Git.

---

## 10. Login errors

Authentication failures should use generic messages.

Do not tell a user:

```text
Username exists but password is wrong.
```

Such messages can help account enumeration.

Prefer:

```text
Invalid username or password.
```

---

## 11. Practical hardening

V1 should include reasonable protection against repeated login attempts, such as rate limiting or a simple failed-attempt strategy.

We should not build a full enterprise identity system for a mini project.

The objective is sensible security, not infrastructure overkill.
