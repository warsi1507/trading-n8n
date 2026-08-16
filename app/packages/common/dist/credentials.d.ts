export interface CredentialResponse {
    _id: string;
    name: string;
    value: string;
    created_at: string;
}
export interface CreateCredentialPayload {
    name: string;
    value: string;
}
