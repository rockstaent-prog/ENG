import { execFileSync } from 'node:child_process';

// This is the portable hosting bundle, not an APK or iPhone installer.
execFileSync('python3', ['scripts/package-mobile.py'], { stdio: 'inherit' });
