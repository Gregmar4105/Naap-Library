/**
 * Resolves the given path into a loadable image URL.
 * Supports standard Laravel storage paths (relative) and 
 * absolute local paths (e.g. windows drive letters) via /media/serve.
 */
export function resolveImageUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;

    // Clean surrounding quotes if present
    const cleanRawPath = path.trim().replace(/^"|"$/g, '');
    if (!cleanRawPath) return undefined;

    // 1. Check if it's already a full URL or data/blob URI
    if (
        cleanRawPath.startsWith('http://') || 
        cleanRawPath.startsWith('https://') ||
        cleanRawPath.startsWith('data:') ||
        cleanRawPath.startsWith('blob:')
    ) {
        return cleanRawPath;
    }

    // 2. Check if it's already a public web-relative path
    if (
        cleanRawPath.startsWith('/storage/') || 
        cleanRawPath.startsWith('/images/') || 
        cleanRawPath.startsWith('/build/') ||
        cleanRawPath.startsWith('/assets/') ||
        cleanRawPath.startsWith('/media/')
    ) {
        return cleanRawPath;
    }

    // 3. Check for absolute local filesystem paths (e.g. Windows C:\ or C:/, or Unix system directories)
    const isWindowsAbsolutePath = /^[a-zA-Z]:[\\/]/.test(cleanRawPath);
    const isUnixFilesystemPath = /^\/(var|home|Users|tmp|opt|usr|app|srv)\//.test(cleanRawPath);

    if (isWindowsAbsolutePath || isUnixFilesystemPath) {
        return `/media/serve?path=${encodeURIComponent(cleanRawPath)}`;
    }

    // 4. Standard relative Laravel storage path
    const cleanPath = cleanRawPath.startsWith('/') ? cleanRawPath.substring(1) : cleanRawPath;
    if (cleanPath.startsWith('storage/')) {
        return `/${cleanPath}`;
    }
    return `/storage/${cleanPath}`;
}
