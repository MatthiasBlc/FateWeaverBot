I'll execute the EPCT workflow for the job system (métiers) implementation described in
docs/doing.md.

● Explore(Analyze job system requirements)
⎿ Done (38 tool uses · 106.9k tokens · 1m 22s)

● Excellent! The exploration phase is complete. Let me now create the implementation plan.

● 📐 IMPLEMENTATION PLAN - Job System (Métiers)

Based on comprehensive exploration, here's the complete implementation plan for adding the job
system to FateWeaverBot.

---

🎯 OBJECTIVES

1. Create a Job database model similar to ResourcesType pattern
2. Add 13 initial jobs with their corresponding abilities
3. Modify character creation to include job selection
4. Update /profil to display job instead of role
5. Add job management to /character-admin
6. Add job creation to /new-element-admin
7. Implement automatic ability assignment/removal on job changes

---

📋 IMPLEMENTATION SEQUENCE

PHASE 1: Database Foundation (Backend)

Files to modify:

1. backend/prisma/schema.prisma - Add Job model and Character.jobId field
2. backend/prisma/seed.ts - Add 13 initial jobs

Changes:

- Add Job model with relationships to Capability (starting/optional abilities)
- Add jobId field to Character model
- Create migration
- Seed 13 jobs linking to existing or new abilities

Key Decision: All 13 initial jobs have optionalAbilityId = null per requirements

---

PHASE 2: Backend API (Backend)

Files to create:

1. backend/src/services/job.service.ts - Job CRUD service
2. backend/src/controllers/jobs.ts - Job HTTP controllers
3. backend/src/routes/jobs.ts - Job API routes

Files to modify: 4. backend/src/services/character.service.ts - Add job assignment logic 5. backend/src/controllers/characters.ts - Handle job in character creation 6. backend/src/routes/index.ts - Register job routes

Key Methods:

- JobService.getAllJobs(), getJobById(), createJob()
- CharacterService.assignJobToCharacter(), changeCharacterJob()
- Auto-assign starting ability when job assigned
- Auto-remove old abilities + assign new abilities when job changed

---

PHASE 3: Bot API Client (Bot)

Files to create:

1. bot/src/services/api/job-api.service.ts - Job API client

Files to modify: 2. bot/src/services/api/index.ts - Export JobAPIService 3. bot/src/types/dto/character.dto.ts - Add job field

Key Methods:

- JobAPIService.getAllJobs(), createJob(), assignJobToCharacter()

---

PHASE 4: Character Creation (Bot)

Files to modify:

1. bot/src/modals/character-modals.ts - Add job selection dropdown

Changes:

- Add StringSelectMenu to character creation modal with all available jobs
- Extract selected jobId from modal submission
- Pass jobId to character creation API call
- Display job name in confirmation message

---

PHASE 5: Profile Display (Bot)

Files to modify:

1. bot/src/features/users/users.handlers.ts - Update profile embed

Changes:

- Line ~317-319: Change "Métier" field from Discord roles to character job name
- Fetch job data with character query
- Display "Aucun métier" if character has no job

---

PHASE 6: Admin - Job Management (Bot)

Files to create:

1. bot/src/features/admin/character-admin/character-jobs.ts - Job admin handlers

Files to modify: 2. bot/src/features/admin/character-admin.handlers.ts - Route job interactions 3. bot/src/features/admin/character-admin.components.ts - Add job button 4. bot/src/features/admin/character-admin/character-select.ts - Add job action

Changes:

- Add "Changer métier" button in advanced character admin menu
- Show dropdown of all jobs
- When job selected, call API to change job
- Display confirmation with removed/added abilities

---

PHASE 7: Admin - Job Creation (Bot)

Files to modify:

1. bot/src/features/admin/new-element-admin.handlers.ts - Add job creation modal

Changes:

- Add "Créer un métier" button
- Create modal with fields: name, description, starting ability ID, optional ability ID
- Submit modal → create job via API
- Display confirmation

---

🔍 EDGE CASES & RISKS

1. Ability Existence: When changing jobs, abilities must exist in database


    - Solution: Validate ability IDs before job change, rollback on error

2. Character Without Job: Should all characters have a job?


    - Decision needed: Make jobId nullable or required?
    - Current plan: Nullable (allow characters without job for flexibility)

3. Discord Role Confusion: "Métier" currently shows Discord roles


    - Solution: Replace with character job, keep Discord roles in separate field if needed

4. Job Deletion: What happens to characters if job is deleted?


    - Solution: Use onDelete: SetNull in Prisma schema

---

✅ SUCCESS CRITERIA

- 13 jobs seeded in database with correct abilities
- Character creation includes job selection dropdown
- /profil displays character's job name
- Admin can change character's job
- Admin can create new jobs
- Abilities automatically assigned/removed on job change
- No existing tests broken
- TypeScript compilation succeeds
- Database migration runs successfully

---

📝 QUESTIONS FOR VALIDATION

1. Job Requirement: Should all characters be REQUIRED to have a job, or is it optional?


    - Current plan: Optional (nullable jobId)

2. Ability Prerequisites: Do all 13 job abilities already exist in database, or should I create
   them during seeding?


    - Current plan: Create abilities if they don't exist

3. Character Role Display: Should Discord roles still be displayed somewhere in profile, or
   completely removed?


    - Current plan: Replace "Métier" field with job, keep Discord roles visible elsewhere

4. Job Change Logging: Should job changes be logged to character history/audit log?


    - Current plan: No logging for MVP (can add later)

5. PA Cost: Should changing jobs cost PA (action points)?


    - Current plan: No PA cost (admin action only for now)

---

🚀 READY TO PROCEED?

Please review this plan and confirm:

1. Are the 5 questions above answered correctly based on your requirements?
2. Should I proceed with the implementation as planned?
3. Any specific priorities or phases to focus on first?

Once approved, I'll begin Phase 1 (Database Foundation).

> 1. Chaque character devrait avoir un Job, pour l'instant c'est plus simple si c'est optionnel.

2. normalement les capacité de chaque jobs existent en seed. Si tu n'en trouve pas une dans le
   seed, préviens moi.
3. Character Role Display: Should Discord roles still be displayed somewhere in profile, or
   completely removed? les rôles discord ne doivent plus être affichés. Je ne suis même pas certain
   qu'ils aient une utilité dans l'applications.
4. Job Change Logging: Should job changes be logged to character history/audit log?


    - Current plan: No logging for MVP (can add later)

5. PA Cost: Should changing jobs cost PA (action points)?


    - Current plan: No PA cost (admin action only for now)

● Perfect! All questions answered. Let me proceed with the implementation.

● Read(backend/prisma/schema.prisma)
⎿ Read 590 lines

● Now let me check the seed file to verify which abilities exist:

● Read(backend/prisma/seed.ts)
⎿ Read 150 lines

● Perfect! All 13 job abilities exist in the seed. Now let me add the Job model to the Prisma schema:
⎿ Interrupted · What should Claude do instead?

> Rédige un document avec ce plan. Je dois pouvoir te dire continue et le lien vers le document et tu fera cette
> mission. (nous allons manquer de crédits pour faire cette mission maintenant car nous sommes à 94 %)

● Write(.supernova/prompt-job-system.md)
⎿ Wrote 1263 lines to .supernova/prompt-job-system.md  
 # 🎯 MISSION: Implémentation du système de métiers (Jobs) ## 📋 CONTEXTE
Implémentation complète d'un système de métiers pour FateWeaverBot basé sur les spécifications de
`docs/doing.md`.
**Validations obtenues:** 1. ✅ jobId optionnel (nullable) sur Character 2. ✅ Les 13 capacités des métiers existent déjà en seed 3. ✅ Ne plus afficher les rôles Discord dans le profil
… +1253 lines (ctrl+o to expand)
⎿ Session limit reached ∙ resets 6pm
