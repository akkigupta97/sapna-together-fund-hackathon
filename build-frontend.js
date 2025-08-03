import { build } from 'vite';

// Build only frontend for S3
await build({
  build: {
    outDir: 'dist-frontend'
  }
});