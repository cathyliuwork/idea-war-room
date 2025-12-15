# S-XX: Security & Authorization

**Version**: 1.0
**Last Updated**: 2025-12-15
**Status**: ✅ Spec Complete
**Priority**: CRITICAL

---

## Quick Reference

**What**: Security guidelines and authorization patterns for protecting user data in API endpoints.

**Why**: Service role key bypasses RLS, requiring explicit authorization checks in application code.

**Dependencies**:
- S-03: Database Schema (RLS policies, user_id columns)
- F-01: External Authentication Integration (user context)

**Used By**: ALL features that access user-scoped data (sessions, ideas, reports, research)

---

## Core Security Principle

### ⚠️ CRITICAL: Service Role Key Bypasses RLS

**The Fundamental Issue**:
- Application uses Supabase **service role key** for server-side database access
- Service role key has **admin privileges** and **bypasses ALL Row-Level Security (RLS) policies**
- RLS policies are NOT enforced for service role connections

**Impact**:
- Without explicit `user_id` filtering, ANY user can access ANY data
- Knowing a session/idea/report ID is enough to access it
- Complete data breach and privacy violation

**Solution**:
- **NEVER rely on RLS alone for authorization**
- **ALWAYS explicitly filter by `user_id`** in queries
- **Use `verifySessionOwnership()` utility** for session-scoped operations

---

## Authorization Patterns

### Pattern 1: Session-Scoped Resources (RECOMMENDED)

Use this pattern for endpoints that operate on sessions, ideas, reports, or research (any resource owned by a session).

**Implementation**: `/src/lib/auth/session-ownership.ts`

```typescript
import { verifySessionOwnership } from '@/lib/auth/session-ownership';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  // 1. Get authenticated user context
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  // 2. Verify user owns this session (CRITICAL SECURITY CHECK)
  const { authorized, session, error } = await verifySessionOwnership(
    supabase,
    params.sessionId,
    user.id
  );

  if (!authorized) {
    // Return 404 (not 403) to avoid leaking session existence
    return NextResponse.json(
      { error: error || 'Session not found or access denied' },
      { status: 404 }
    );
  }

  // 3. Safe to proceed - user owns this session
  // Access ideas, reports, research using params.sessionId
  const { data } = await supabase
    .from('damage_reports')
    .select('*')
    .eq('session_id', params.sessionId)
    .single();

  return NextResponse.json({ report: data });
}
```

**When to use**:
- `GET /api/sessions/[sessionId]/report`
- `GET /api/sessions/[sessionId]/idea`
- `POST /api/sessions/[sessionId]/analyze`
- `POST /api/sessions/[sessionId]/research`
- Any endpoint with `[sessionId]` in the path

**Benefits**:
- Centralized authorization logic
- Consistent error messages
- Returns session data for reuse
- Prevents code duplication

---

### Pattern 2: Explicit user_id Filtering

Use this pattern for endpoints that query user data directly (not session-scoped).

```typescript
export async function GET(request: NextRequest) {
  const { supabase, user } = await createAuthenticatedSupabaseClient();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // CRITICAL: Explicitly filter by user_id
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)  // CRITICAL: Filter by authenticated user
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessions });
}
```

**When to use**:
- `GET /api/sessions` - List user's sessions
- `POST /api/sessions/create` - Create session for user
- Any endpoint that queries by user_id

**Critical requirement**:
- **EVERY query** must include `.eq('user_id', user.id)`
- **Including count/aggregate queries**

---

## Security Checklist

### For Every API Endpoint

Before deploying ANY endpoint that accesses user data:

- [ ] **Authentication**: Call `createAuthenticatedSupabaseClient()` to get `user` context
- [ ] **User verification**: Check `if (!user) return 401`
- [ ] **Authorization**:
  - [ ] For session-scoped: Use `verifySessionOwnership()`
  - [ ] For user-scoped: Add `.eq('user_id', user.id)` to ALL queries
- [ ] **Error handling**: Return 404 (not 403) for unauthorized access
- [ ] **Testing**: Test with multiple users (Alice/Bob scenario)
- [ ] **Code review**: Verify no queries bypass user_id filtering

### Testing Multi-User Isolation

**Required test for every endpoint**:

```typescript
it('should enforce user isolation (CRITICAL SECURITY TEST)', async () => {
  const userA = await createTestUser('alice@example.com');
  const userB = await createTestUser('bob@example.com');

  // Create resource for User A
  const resourceA = await createResource(userA);

  // User B attempts to access User A's resource
  const response = await fetch(`/api/resource/${resourceA.id}`, {
    headers: { Authorization: `Bearer ${userB.token}` }
  });

  // MUST return 404 (not the resource data)
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    error: 'Session not found or access denied'
  });
});
```

---

## Common Vulnerabilities

### ❌ Vulnerability 1: Missing user_id Filter

```typescript
// WRONG - Missing user_id check
const { data } = await supabase
  .from('sessions')
  .select('*')
  .eq('id', sessionId);  // User can access ANY session!
```

```typescript
// CORRECT - Explicit user_id filter
const { data } = await supabase
  .from('sessions')
  .select('*')
  .eq('id', sessionId)
  .eq('user_id', user.id);  // Only user's own sessions
```

---

### ❌ Vulnerability 2: Relying on RLS with Service Role Key

```typescript
// WRONG - Comment claims RLS enforcement
const { data } = await supabase  // Uses service role key!
  .from('sessions')
  .select('*')
  .eq('id', sessionId);  // RLS does NOT enforce here!

// Comment: "RLS will filter by user" ← FALSE!
```

```typescript
// CORRECT - Explicit verification
const { authorized } = await verifySessionOwnership(
  supabase,
  sessionId,
  user.id
);

if (!authorized) {
  return error(404);
}
```

---

### ❌ Vulnerability 3: Missing Authorization in Updates

```typescript
// WRONG - No ownership check before update
await supabase
  .from('sessions')
  .update({ status: 'completed' })
  .eq('id', sessionId);  // User can update ANY session!
```

```typescript
// CORRECT - Verify ownership first
const { authorized } = await verifySessionOwnership(
  supabase,
  sessionId,
  user.id
);

if (!authorized) {
  return error(404);
}

await supabase
  .from('sessions')
  .update({ status: 'completed' })
  .eq('id', sessionId);
```

---

### ❌ Vulnerability 4: Forgetting Count/Aggregate Queries

```typescript
// WRONG - Count query missing user_id filter
const { count } = await supabase
  .from('sessions')
  .select('*', { count: 'exact', head: true });
// Returns count of ALL users' sessions!
```

```typescript
// CORRECT - Filter count queries too
const { count } = await supabase
  .from('sessions')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id);
// Returns count of current user's sessions only
```

---

## Response Standards

### Success Response

```typescript
return NextResponse.json({ data: ... }, { status: 200 });
```

### Authentication Failure (No User)

```typescript
return NextResponse.json(
  { error: 'Unauthorized' },
  { status: 401 }
);
```

### Authorization Failure (Not Owner)

```typescript
// Use 404, not 403, to avoid leaking resource existence
return NextResponse.json(
  { error: 'Session not found or access denied' },
  { status: 404 }
);
```

### Validation Failure

```typescript
return NextResponse.json(
  { error: 'Invalid input', details: validationErrors },
  { status: 400 }
);
```

---

## Security Audit History

### 2025-12-15: Authorization Bypass Vulnerability

**Discovered**: During F-09 (Session History) implementation
**Severity**: CRITICAL
**Impact**: 7 vulnerable endpoints allowed cross-user data access

**Root Cause**: Service role key bypasses RLS; endpoints relied on RLS instead of explicit filtering

**Affected Endpoints**:
- GET /api/sessions/[sessionId]/status
- GET /api/sessions/[sessionId]/idea
- POST /api/sessions/[sessionId]/idea
- GET /api/sessions/[sessionId]/report
- POST /api/sessions/[sessionId]/analyze
- POST /api/sessions/[sessionId]/research
- GET /api/sessions/[sessionId]/research/status

**Resolution**:
1. Created `verifySessionOwnership()` utility function
2. Updated all 7 endpoints to use authorization pattern
3. Added explicit `user_id` filtering to queries
4. Updated S-03 database spec with security warnings
5. Created this security specification document

**Full Report**: `/docs/SECURITY-AUDIT-2025-12-15.md`

---

## References

- **S-03: Database Schema** - RLS policies, service role key behavior
- **Implementation**: `/src/lib/auth/session-ownership.ts`
- **Security Audit**: `/docs/SECURITY-AUDIT-2025-12-15.md`
- **Supabase Docs**: [Service Role Key Behavior](https://supabase.com/docs/guides/auth/row-level-security)

---

## Enforcement

### Pull Request Checklist

Every PR that adds/modifies API endpoints must:

- [ ] Include security review for authorization checks
- [ ] Test with multiple users (Alice/Bob scenario)
- [ ] Document which authorization pattern is used
- [ ] Add integration test for user isolation

### Code Review Focus

Reviewers must verify:

- [ ] No queries missing `user_id` filter
- [ ] No comments claiming "RLS handles this"
- [ ] Authorization checks before ANY data access
- [ ] 404 (not 403) for unauthorized access

---

## Future Improvements

### Considered But Not Implemented

**ESLint Rule**: Auto-detect missing user_id filters
- **Status**: Not implemented (requires custom AST analysis)
- **Alternative**: Manual code review with checklist

**Anonymous Key for Read Operations**: Use anon key instead of service role
- **Status**: Not implemented (requires refactoring auth middleware)
- **Trade-off**: Service role needed for rate limit bypass

**Database Views**: Create user-scoped views with RLS
- **Status**: Not implemented (adds query complexity)
- **Preference**: Explicit filtering is more auditable

---

**Version Control**:
- v1.0 (2025-12-15): Initial security specification after authorization vulnerability discovery
