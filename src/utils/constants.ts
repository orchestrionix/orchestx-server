export const TCP_PORT = 12340;
// Use 127.0.0.1 explicitly so we always use IPv4. 'localhost' can resolve to ::1 (IPv6)
// and DecapPlayer typically only listens on IPv4, causing ECONNREFUSED when running as exe.
export const TCP_HOST = '127.0.0.1';

export const DEFAULT_ERROR_MESSAGE = "Something went wrong"