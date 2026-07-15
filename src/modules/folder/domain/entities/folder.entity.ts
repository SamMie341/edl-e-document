export class Folder {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public status: string,
    public qrCode: string,
    public locationRef: string | null,
    public description: string,
    public shelfId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public shelf?: {
      id: string;
      name: string;
      description: string | null;
      status: string;
      maxQty: number;
      // lockerId: string;
      locker?: {
        id: string;
        code: string;
        name: string | null;
        description: string | null;
        status: string;
        warehouse?: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          status: string;
          department?: {
            id: number;
            code: string;
            name: string;
          } | null;
          division?: {
            id: number;
            code: string;
            name: string;
            shortName: string;
          } | null;
        } | null;
      } | null;
    },
    public documents?: {
      id: string,
      docNo: string,
      shortName: string | null,
      docDate: Date,
      title: string,
      description: string | null,
      docExpire: Date,
      qrCode: string,
      isContractBound: boolean,
    }[],
    public documentCount?: number,
  ) { }
}
