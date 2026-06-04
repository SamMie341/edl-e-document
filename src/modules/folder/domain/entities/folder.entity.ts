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
      lockerId: string;
    },
    public documentCount?: number,
  ) { }
}
