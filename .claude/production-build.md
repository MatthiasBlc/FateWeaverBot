# Production Build Configuration

## TypeScript Compilation for Production

### Path Mappings Resolution

**Problem**: TypeScript path mappings (`@shared/*`) are not resolved in compiled JavaScript.

**Solution**: Use `tsconfig-paths/register` at runtime to resolve path mappings.

### Backend Configuration

**File**: `backend/package.json`

```json
{
  "scripts": {
    "start": "node -r tsconfig-paths/register dist/src/server.js",
    "start:migrate:prod": "prisma migrate deploy && prisma db seed && node -r tsconfig-paths/register dist/src/server.js"
  },
  "dependencies": {
    "tsconfig-paths": "^4.2.0",
    "zod": "^3.23.8"
  }
}
```

**Key Points**:
- `-r tsconfig-paths/register` enables runtime path resolution
- `tsconfig-paths` must be in `dependencies` (not `devDependencies`)
- `tsconfig.json` must be present in the Docker image (already copied in Dockerfile line 50)

### Shared Directory Handling

#### Local Development
- **Symlink**: `backend/shared -> ../shared`
- **Purpose**: Allows TypeScript to find `@shared/*` imports
- **Setup**: `cd backend && ln -sfn ../shared shared`
- **Git**: Ignored via `.gitignore`

#### Production (Docker)
- **No symlink needed**: Dockerfile copies real files
- **Backend Dockerfile** (line 20): `COPY ./shared ./shared`
- **Bot Dockerfile** (line 6): `COPY ./shared /shared`
- **Build context**: Project root (`.`), so `./shared` is accessible

### Docker Build Verification

Both builds must succeed:

```bash
# Backend
docker build -f backend/Dockerfile -t test-backend .

# Bot
docker build -f bot/Dockerfile -t test-bot .
```

**Expected structure in backend image**:
```
/app/
├── dist/
│   ├── src/
│   │   └── server.js
│   └── shared/          # Compiled shared code
│       └── constants/
├── shared/              # Source shared code (for path resolution)
│   └── constants/
├── tsconfig.json        # Needed by tsconfig-paths
├── package.json
└── node_modules/
    └── tsconfig-paths/  # Must be present
```

### Deployment Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
1. Build backend image
2. Build bot image
3. Push to registry
4. Deploy via Portainer API

**No changes needed** to deployment files - everything works with current configuration.

### Troubleshooting

#### "Cannot find module '@shared/...'" (Local)
- Missing symlink
- Solution: `cd backend && ln -sfn ../shared shared`

#### "Cannot find module '@shared/...'" (Production)
- Missing `tsconfig-paths` in dependencies
- Missing `tsconfig.json` in Docker image
- Check: `docker run --rm IMAGE_NAME ls /app/node_modules/ | grep tsconfig`

#### Build fails with permission denied on `dist/shared`
- Old `dist/` created by Docker with root permissions
- Solution: `sudo rm -rf backend/dist` then rebuild

### Related Files

- `backend/SETUP.md` - Local development setup
- `backend/tsconfig.json` - TypeScript configuration
- `backend/tsconfig.docker.json` - Docker build configuration
- `backend/Dockerfile` - Production image build
- `shared/constants/emojis.ts` - Shared constants

### Version History

- **2025-10-22**: Initial production build fix
  - Added `tsconfig-paths/register` to runtime
  - Fixed `zod` version (`^4.1.12` → `^3.23.8`)
  - Documented symlink setup
  - Verified Docker builds
