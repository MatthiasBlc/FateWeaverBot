# Backend Setup

## Initial Setup

1. **Create symlink to shared directory:**
   ```bash
   cd backend
   ln -sfn ../shared shared
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

## Development

### Local Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Docker Development
```bash
# From project root
docker compose up -d backenddev
```

## Important Notes

### Local Development
- The `backend/shared` symlink points to `../shared` and is **required for local development**
- This symlink is ignored by git (see `.gitignore`)
- The `@shared/*` path alias is configured in `tsconfig.json`
- Required for TypeScript compilation to work locally

### Production (Docker)
- **No symlink needed**: Dockerfile copies real files from `./shared`
- `tsconfig-paths/register` resolves path mappings at runtime
- See `.claude/production-build.md` for production build details

### Runtime Path Resolution
- Production uses `node -r tsconfig-paths/register dist/src/server.js`
- This allows compiled JS to resolve `@shared/*` imports
- `tsconfig-paths` must be in `dependencies`, not `devDependencies`

## Troubleshooting

### "Cannot find module '@shared/...'" (Local Development)
- Ensure the `backend/shared` symlink exists: `ls -la backend/shared`
- If missing, recreate it: `cd backend && ln -sfn ../shared shared`
- Should show: `shared -> ../shared`

### "Cannot find module '@shared/...'" (Production/Docker)
- Check `tsconfig-paths` is in dependencies: `npm list tsconfig-paths`
- Verify `tsconfig.json` exists in Docker image
- Check startup command includes `-r tsconfig-paths/register`

### Build fails with permission denied on `dist/shared`
- Old `dist/` was created by Docker with root permissions
- Solution: `sudo rm -rf backend/dist` then rebuild

### Build fails in Docker
- Check that Docker volumes are correctly mounted in `docker-compose.yml`
- Verify `tsconfig.docker.json` paths configuration
- Ensure `./shared` directory exists at project root
