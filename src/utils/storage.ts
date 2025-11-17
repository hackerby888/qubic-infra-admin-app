import type { User } from "@/types/type";
import { jwtDecode } from "jwt-decode";

export const MyStorage = {
    setLoginCredential(token: string) {
        localStorage.setItem("token", token);
    },

    getLoginCredential() {
        return localStorage.getItem("token") || "";
    },

    clearLoginCredential() {
        localStorage.removeItem("token");
    },

    decodeTokenPayload(token: string) {
        try {
            if (!token) return null;
            let object = jwtDecode(token) as User;
            return object;
        } catch (error) {
            return null;
        }
    },

    getUserInfo(): User | null {
        let token = this.getLoginCredential();
        return this.decodeTokenPayload(token);
    },
};
