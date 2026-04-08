/**
 * Cross-platform launcher for the face_engine uvicorn server.
 *
 * On every run it will:
 *   1. Create face_engine/venv if it does not exist yet.
 *   2. Install / update packages from face_engine/requirements.txt.
 *   3. Start uvicorn using the venv Python.
 *
 * Python resolution order:
 *   1. PYTHON_PATH env variable  (set in .env or your shell)
 *   2. System-level python3  (Linux/macOS)  |  python  (Windows)
 */

import { existsSync } from 'fs';
import { platform } from 'os';
import { resolve } from 'path';
import { spawnSync, spawn } from 'child_process';

const IS_WINDOWS = platform() === 'win32';
const VENV_DIR = resolve('face_engine', 'venv');
const VENV_PYTHON = IS_WINDOWS
    ? resolve(VENV_DIR, 'Scripts', 'python.exe')
    : resolve(VENV_DIR, 'bin', 'python');
const VENV_PIP = IS_WINDOWS
    ? resolve(VENV_DIR, 'Scripts', 'pip.exe')
    : resolve(VENV_DIR, 'bin', 'pip');
const REQUIREMENTS = resolve('face_engine', 'requirements.txt');

// ── helpers ──────────────────────────────────────────────────────────────────

function systemPython() {
    if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;
    return IS_WINDOWS ? 'python' : 'python3';
}

function run(cmd, args, label) {
    console.log(`[face-engine] ${label}`);
    const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
    if (result.error) {
        console.error(`[face-engine] ERROR: ${result.error.message}`);
        process.exit(1);
    }
    if (result.status !== 0) {
        console.error(
            `[face-engine] '${cmd} ${args.join(' ')}' exited with code ${result.status}`,
        );
        process.exit(result.status ?? 1);
    }
}

// ── 1. create venv if missing ─────────────────────────────────────────────────

if (!existsSync(VENV_PYTHON)) {
    const sysPython = systemPython();
    console.log(`[face-engine] Venv not found – creating at ${VENV_DIR}`);
    console.log(`[face-engine] Using system Python: ${sysPython}`);
    run(sysPython, ['-m', 'venv', VENV_DIR], 'Creating virtual environment…');
}

// ── 2. install / sync requirements ───────────────────────────────────────────

if (existsSync(REQUIREMENTS)) {
    run(
        VENV_PIP,
        ['install', '-r', REQUIREMENTS],
        'Installing requirements from face_engine/requirements.txt…',
    );
} else {
    console.warn(
        '[face-engine] WARNING: face_engine/requirements.txt not found – skipping install.',
    );
}

// ── 3. launch uvicorn ─────────────────────────────────────────────────────────

console.log(`[face-engine] Starting uvicorn with: ${VENV_PYTHON}`);

const proc = spawn(
    VENV_PYTHON,
    ['-m', 'uvicorn', 'main:app', '--port', '8000', '--app-dir', 'face_engine'],
    { stdio: 'inherit', shell: false },
);

proc.on('error', (err) => {
    console.error(`[face-engine] Failed to start uvicorn: ${err.message}`);
    console.error(
        '[face-engine] Tip: set PYTHON_PATH in your .env to point at a valid Python executable.',
    );
    process.exit(1);
});

proc.on('exit', (code) => {
    process.exit(code ?? 0);
});
