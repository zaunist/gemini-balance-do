export function getAuthKey(request: Request, sessionKey?: string): string | undefined {
    if (sessionKey) return sessionKey;
    const cookie = request.headers.get('Cookie');
    if (cookie) {
        const match = cookie.match(/auth-key=([^;]+)/);
        if (match) return match[1];
    }
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        return authHeader.replace(/^Bearer\s+/, '');
    }
    return undefined;
}