export interface IUser {
  email: string;
  name: string;
  created_at: Date;
}
export declare const User: import("mongoose").Model<
  IUser,
  {},
  {},
  {},
  import("mongoose").Document<
    unknown,
    {},
    IUser,
    {},
    import("mongoose").DefaultSchemaOptions
  > &
    IUser & {
      _id: import("mongoose").Types.ObjectId;
    } & {
      __v: number;
    } & {
      id: string;
    },
  any,
  IUser
>;
