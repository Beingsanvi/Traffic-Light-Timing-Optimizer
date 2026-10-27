// Actionable connection errors without exposing the URI or credentials.
export function databaseErrorMessage(error) {
    if (error.code === 'INVALID_MONGO_URI') {
        return 'The MongoDB URI contains an unescaped @ in its credentials. URL-encode the username/password (for example, @ becomes %40) in .env.';
    }
    if (error.code === 'ENOTFOUND') {
        return 'MongoDB DNS lookup failed. Check for unescaped characters in the URI credentials, then check the Atlas hostname and DNS connectivity.';
    }
    if (error.code === 18 || /authentication failed|bad auth/i.test(error.message || '')) {
        return 'MongoDB authentication failed. Check the Atlas database user and password in .env.';
    }
    const servers = [...(error.reason?.servers?.values() || [])];
    const errors = [error, ...servers.map(server => server.error)];
    const isTlsRejection = errors.some(candidate => {
        for (let depth = 0; candidate && depth < 5; depth++, candidate = candidate.cause) {
            if (candidate.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') return true;
        }
        return false;
    });
    if (isTlsRejection) {
        return 'Atlas TLS handshake failed. Check that your current public IP is allowed in Atlas Network Access; also check for VPN/firewall TLS interference. Collections are created automatically only after a successful connection.';
    }
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError' || error.name === 'MongoNetworkTimeoutError') {
        return 'MongoDB servers could not be reached. Check Atlas Network Access, cluster availability, and outbound network connectivity.';
    }
    return 'Check .env, the MongoDB database user, and network access.';
}

export function validateMongoUri(uri) {
    // The driver can interpret the first raw @ as the credentials separator,
    // even when WHATWG URL parsing interprets the last @ as that separator.
    const authority = uri.slice(uri.indexOf('://') + 3).split('/')[0];
    if ((authority.match(/@/g) || []).length > 1) {
        const error = new Error('Unescaped credential separator in MongoDB URI');
        error.code = 'INVALID_MONGO_URI';
        throw error;
    }
}
