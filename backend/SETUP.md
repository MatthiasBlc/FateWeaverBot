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

- The `backend/shared` symlink points to `../shared` and is required for local development
- This symlink is ignored by git (see `.gitignore`)
- The `@shared/*` path alias is configured in `tsconfig.json` and works in both local and Docker environments
- Docker uses `tsconfig.docker.json` for builds and `scripts/seed-docker.sh` for seeding

## Troubleshooting

### "Cannot find module '@shared/...'"
- Ensure the `backend/shared` symlink exists: `ls -la backend/shared`
- If missing, recreate it: `ln -sfn ../shared backend/shared`

### Build fails in Docker
- Check that Docker volumes are correctly mounted in `docker-compose.yml`
- Verify `tsconfig.docker.json` paths configuration
