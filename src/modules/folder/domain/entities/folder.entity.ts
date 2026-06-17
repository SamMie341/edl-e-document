export class Folder {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public status: string,
    public qrCode: string,
    public locationRef: string | null,
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
          address?: {
            id: string;
            code: string;
            name: string;
            details: string;
            status: string;
            division?: {
              id: string;
              code: string;
              name: string;
              status: string;
            } | null;
          } | null;
        } | null;
      } | null;
    },
    public documents?: {
      id: string,
      docNo: string,
      shortName: string | null,
      docDate: Date,
      subDocNo: string | null,
      subDocDate: Date | null,
      title: string,
      description: string | null,
      docExpire: Date,
      qrCode: string,
      isContractBound: boolean,
    }[],
    public documentCount?: number,
  ) { }
}
