/**
 * Resolves the given path into a loadable image URL.
 * Supports standard Laravel storage paths (relative) and 
 * absolute local paths (e.g. windows drive letters) via /media/serve.
 */
export function resolveImageUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;

    // Clean surrounding quotes if present
    const cleanRawPath = path.trim().replace(/^"|"$/g, '');

    // 1. Check if it's already a URL (http / https)
    if (cleanRawPath.startsWith('http://') || cleanRawPath.startsWith('https://')) {
        return cleanRawPath;
    }

    // 2. Check for absolute paths (Windows C:\ or D:\, or Unix /)
    // We look for a drive letter pattern at the start (e.g. C:\)
    const isWindowsAbsolutePath = /^[a-zA-Z]:\\/.test(cleanRawPath);
    const isUnixAbsolutePath = cleanRawPath.startsWith('/');

    if (isWindowsAbsolutePath || isUnixAbsolutePath) {
        return `/media/serve?path=${encodeURIComponent(cleanRawPath)}`;
    }

    // 3. Otherwise, assume it's a standard Laravel storage path
    // Remove leading slash if it exists to avoid //storage
    const cleanPath = cleanRawPath.startsWith('/') ? cleanRawPath.substring(1) : cleanRawPath;
    return `/storage/${cleanPath}`;
}
