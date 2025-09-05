# Caldo Database Schema (Current)

## Overview

We use a flat, query-first schema to support fast daily/weekly/monthly views and future portability (e.g., swapping Firestore for MongoDB behind repository interfaces).

## Collections

- Tasks: `users/{uid}/tasks/{taskId}`
  - One document per task (no arrays). Optimized for range/equality queries.
  - Security and queries scoped per-user.

- Day notes: `users/{uid}/dayNotes/{dateKey}`
  - One document per day note (at most one note per day).

- Snippets: `users/{uid}/snippets/{snippetId}`
  - Developer-focused global notes (code/JSON/markdown). Not date-bound.

- Meta: `users/{uid}/meta/streakInfo`
  - Single document for streak data.

## Task document
```json
{
  "ownerUid": "<uid>",
  "title": "Task title",
  "notes": "Optional notes",
  "done": false,
  "priority": "low|medium|high",
  "subtasks": [ { "id": "...", "title": "...", "done": false, "createdAt": <timestamp> } ],
  "reminderTime": "20:00", // Optional time in 24-hour format (HH:MM)

  // Denormalized keys for fast filters
  "dateKey": "YYYY-MM-DD",
  "monthKey": "YYYY-MM",
  "dueDate": <timestamp>,

  "createdAt": <timestamp>,
  "updatedAt": <timestamp>
}
```

Notes:
- `dueDate` is used for range queries.
- `dateKey`/`monthKey` enable simple equality filters.
- `ownerUid` is stored for integrity and future collection-group use.
- `subtasks` are embedded for simplicity (not independently queried).

## Day note document
```json
{
  "ownerUid": "<uid>",
  "dateKey": "YYYY-MM-DD",
  "content": "Note content",
  "updatedAt": <timestamp>
}
```

## Snippet document
```json
{
  "ownerUid": "<uid>",
  "title": "Untitled snippet",
  "content": "Markdown/code content",
  "tags": ["api", "json"],
  "language": "js|null",
  "pinned": false,
  "archived": false,
  "copyCount": 0,
  "lastCopiedAt": <timestamp|null>,
  "createdAt": <timestamp>,
  "updatedAt": <timestamp>
}
```

## Meta (streak)
Path: `users/{uid}/meta/streakInfo`
```json
{
  "current": 0,
  "longest": 0,
  "lastEarnedDateKey": "YYYY-MM-DD|null",
  "updatedAt": <timestamp>
}
```

## Common queries

- Daily tasks:
```js
tasks.where('ownerUid','==',uid).where('dateKey','==',dateKey)
```

- Monthly tasks (preferred):
```js
tasks.where('ownerUid','==',uid)
     .where('dueDate','>=',monthStart)
     .where('dueDate','<',nextMonthStart)
```

- Monthly notes:
```js
dayNotes.where('ownerUid','==',uid)
        .where('dateKey','>=',"YYYY-MM-01")
        .where('dateKey','<',"YYYY-(MM+1)-01")
```

## Indexes

- Composite: `users/{uid}/tasks` on `(ownerUid ASC, dueDate ASC)`
- Optionally, composite on `(ownerUid ASC, monthKey ASC)` if you prefer equality over range (not required).

## Security rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Tasks
    match /users/{userId}/tasks/{taskId} {
      allow read: if request.auth != null && request.auth.uid == userId;

      // Create requires correct owner
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.ownerUid == userId;

      // Update forbids changing ownerUid
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && resource.data.ownerUid == userId
                    && request.resource.data.ownerUid == userId;

      // Delete requires ownership
      allow delete: if request.auth != null
                    && request.auth.uid == userId
                    && resource.data.ownerUid == userId;
    }

    // Day notes
    match /users/{userId}/dayNotes/{dateKey} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null
                            && request.auth.uid == userId
                            && (resource == null || resource.data.ownerUid == userId)
                            && request.resource.data.ownerUid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Snippets
    match /users/{userId}/snippets/{snippetId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.ownerUid == userId;
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && resource.data.ownerUid == userId
                    && request.resource.data.ownerUid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Meta (streak)
    match /users/{userId}/meta/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## App integration (current)

- Repositories
  - `TaskRepository` (flat tasks API)
  - `DayNoteRepository` (day notes API)
- Month view: one tasks range query + one notes range query, merged client-side by `dateKey`.
- Day view: equality by `dateKey` + single note doc.

## Migration

No migration required (development phase). Old nested per-day schema is removed from the app code. New writes go only to `tasks` and `dayNotes`.

## Recurring tasks collection

- Recurring series: `users/{uid}/recurringTasks/series`
  - One document containing all recurring series for a user.
  - Each series defines a recurring pattern and materializes into individual task instances.

### Recurring series document
```json
{
  "ownerUid": "<uid>",
  "series": [
    {
      "id": "rec_<seriesId>",
      "title": "Recurring task title",
      "notes": "Optional notes",
      "priority": "low|medium|high",
      "subtasks": [ { "id": "...", "title": "...", "done": false, "createdAt": <timestamp> } ],
      "startDateKey": "YYYY-MM-DD",
      "reminderTime": "20:00", // Optional time in 24-hour format (HH:MM)
      "recurrence": {
        "frequency": "daily|weekly|monthly",
        "interval": 1,
        "byWeekday": [1, 3, 5], // For weekly: 0-6 (Sun-Sat)
        "byMonthday": [1, 15], // For monthly: 1-31
        "ends": { "type": "never|onDate|afterCount", "onDateKey": "YYYY-MM-DD", "count": 10 }
      },
      "exceptions": ["YYYY-MM-DD"], // dateKeys to skip
      "overrides": {
        "YYYY-MM-DD": {
          "title": "Custom title for this occurrence",
          "notes": "Custom notes",
          "priority": "high",
          "done": true,
          "subtasks": [...],
          "reminderTime": "21:00" // Override reminder for this occurrence
        }
      }
    }
  ],
  "updatedAt": <timestamp>,
  "createdAt": <timestamp>
}
```

Notes:
- Recurring series are stored in a single document per user for efficient batch operations.
- Individual task instances are materialized on-demand from series definitions.
- `reminderTime` is inherited by all instances unless overridden for specific occurrences.
- `overrides` allow customizing individual occurrences without affecting the series.

## Future enhancements

- Tags and filters: store `tags: string[]`, add composite indexes on `(ownerUid, tags)` if needed (or query client-side for small sets).
- External search: integrate Algolia/Meili for full-text across large datasets.

