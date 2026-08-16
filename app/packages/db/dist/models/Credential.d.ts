import { Types } from "mongoose";
export interface ICredential {
    user_id: Types.ObjectId;
    name: string;
    encrypted_value: string;
    iv: string;
    auth_tag: string;
    created_at: Date;
}
export declare const Credential: import("mongoose").Model<ICredential, {}, {}, {}, import("mongoose").Document<unknown, {}, ICredential, {}, import("mongoose").DefaultSchemaOptions> & ICredential & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ICredential>;
