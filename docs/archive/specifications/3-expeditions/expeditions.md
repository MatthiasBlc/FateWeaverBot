# Expeditions v1 Documentation

## Overview

The Expeditions feature allows characters to participate in expeditions that take food from their town and return it after a specified duration. Expeditions have different statuses and affect character availability for city commands.

## Database Schema

### Expedition Model
- `id`: Unique identifier (CUID)
- `name`: Expedition name
- `townId`: Foreign key to Town
- `status`: Enum (PLANNING, LOCKED, DEPARTED, RETURNED)
- `foodStock`: Amount of food taken from town
- `duration`: Duration in hours
- `returnAt`: Expected return time (null if not departed)
- `createdBy`: Discord user ID who created the expedition
- `createdAt/updatedAt`: Timestamps

### ExpeditionMember Model
- `id`: Unique identifier (CUID)
- `expeditionId`: Foreign key to Expedition
- `characterId`: Foreign key to Character
- `joinedAt`: When character joined
- `createdAt/updatedAt`: Timestamps

### ExpeditionStatus Enum
- `PLANNING`: Expedition is being planned, members can join/leave
- `LOCKED`: Expedition is locked, ready for departure
- `DEPARTED`: Expedition has departed, members cannot use city commands
- `RETURNED`: Expedition has returned, food returned to town

## API Endpoints

### User Endpoints

#### POST /api/expeditions
Create a new expedition.

**Request Body:**
```json
{
  "name": "Expedition Name",
  "foodStock": 50,
  "duration": 24,
  "townId": "town-id",
  "discordGuildId": "guild-id" // Optional, for guild resolution
}
```

**Response:** Expedition object

#### GET /api/expeditions/:id
Get expedition by ID.

**Response:** ExpeditionWithDetails object

#### GET /api/expeditions/town/:townId
Get all expeditions for a town (excludes RETURNED by default).

**Query Parameters:**
- `includeReturned`: Set to "true" to include returned expeditions

#### POST /api/expeditions/:id/join
Join an expedition.

**Request Body:**
```json
{
  "characterId": "character-id"
}
```

#### POST /api/expeditions/:id/leave
Leave an expedition.

**Request Body:**
```json
{
  "characterId": "character-id"
}
```

#### POST /api/expeditions/:id/transfer
Transfer food between expedition and town.

**Request Body:**
```json
{
  "amount": 10,
  "direction": "to_town" | "from_town"
}
```

### Admin Endpoints

#### GET /api/admin/expeditions
Get all expeditions with optional filtering.

**Query Parameters:**
- `includeReturned`: Include returned expeditions
- `townId`: Filter by town
- `status`: Filter by status

#### PATCH /api/admin/expeditions/:id
Modify expedition (duration, food stock).

**Request Body:**
```json
{
  "duration": 48,
  "foodStock": 75
}
```

#### POST /api/admin/expeditions/:id/force-return
Force return an expedition immediately.

#### POST /api/admin/expeditions/:id/lock
Lock an expedition (PLANNING → LOCKED).

#### POST /api/admin/expeditions/:id/depart
Depart an expedition (LOCKED → DEPARTED).

## Cron Jobs

### Expedition Lock (Daily at 00:00)
Locks all PLANNING expeditions created before midnight.

**Schedule:** `0 0 * * *`

### Expedition Depart (Daily at 08:00)
Departs all LOCKED expeditions.

**Schedule:** `0 8 * * *`

### Expedition Return (Every 10 minutes)
Returns DEPARTED expeditions whose `returnAt` time has passed.

**Schedule:** `*/10 * * * *`

## Business Rules

### Expedition Lifecycle
1. **PLANNING**: Expedition is created, members can join/leave, food can be transferred
2. **LOCKED**: Expedition is locked, no more changes allowed, ready for departure
3. **DEPARTED**: Expedition has left, members cannot use city commands
4. **RETURNED**: Expedition has returned, food returned to town, expedition archived

### Food Management
- Food is taken from town when expedition is created
- Food can be transferred between town and expedition during PLANNING phase
- Food is returned to town when expedition returns
- If last member leaves during PLANNING, expedition is terminated and food returned

### Character Restrictions
- Characters on LOCKED or DEPARTED expeditions cannot use city commands
- Characters can only be on one active expedition at a time
- Only active, non-dead characters can join expeditions

### Membership Rules
- Members can join/leave only during PLANNING phase
- Unique constraint ensures characters can only be on one expedition
- If expedition has no members during PLANNING, it gets terminated

## Bot Commands

### /expedition start
Modal-based command to create expeditions.

### /expedition join
Dropdown selection of PLANNING expeditions.

### /expedition info
Show expedition details with buttons (Leave, Transfer) for members.

### /expedition-admin
Admin command for expedition management (ephemeral responses).

## Error Handling

### HTTP Status Codes
- `400`: Bad request (validation errors, business rule violations)
- `401`: Unauthorized (user not authenticated)
- `404`: Not found (expedition, character, town)
- `409`: Conflict (race conditions, concurrent modifications)
- `500`: Internal server error

### Validation Errors
- Expedition name required and unique per town
- Food stock must be positive and not exceed town stock
- Duration must be positive
- Character must be active and not dead
- Expedition status must allow the requested action

## Migration Guide

1. Run `prisma migrate dev` to apply schema changes
2. Run `prisma generate` to update Prisma client
3. Start the application to initialize cron jobs
4. Deploy bot commands using `npm run deploy`

## Testing

Run expedition flows:
1. Create expedition with food
2. Join character to expedition
3. Transfer food between town/expedition
4. Leave last member (should terminate expedition)
5. Test cron job transitions manually by calling admin endpoints

## Security Considerations

- All endpoints require authentication
- Admin endpoints require admin permissions
- Input validation prevents negative food values
- Transactions ensure data consistency
- Logging tracks all state changes for audit
