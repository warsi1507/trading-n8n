export interface ICounter {
  _id: string;
  sequence_value: number;
}
export declare const Counter: import("mongoose").Model<
  ICounter,
  {},
  {},
  {},
  import("mongoose").Document<
    unknown,
    {},
    ICounter,
    {},
    import("mongoose").DefaultSchemaOptions
  > &
    ICounter &
    Required<{
      _id: string;
    }> & {
      __v: number;
    } & {
      id: string;
    },
  any,
  ICounter
>;
