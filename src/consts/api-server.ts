let _envApiServer = import.meta.env.VITE_API_SERVER;
if (_envApiServer && _envApiServer.endsWith("/")) {
    _envApiServer = _envApiServer.slice(0, -1);
}
export const API_SERVER = _envApiServer || "http://localhost:3000";
