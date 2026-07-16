export class DocumentBorrowEntity {
  constructor(
    public readonly id: string,
    public readonly documentId: string | null,
    public readonly folderId: string | null,
    public readonly borrower: string,
    public readonly phone: string | null,
    public readonly borrowedAt: Date,
    public readonly returnedAt: Date | null,
    public readonly dueDate: Date | null,
    public readonly purpose: string | null,
    public readonly toDivisionId: number | null,
    public readonly toLocation: string | null,
    public readonly createdById: string,
    public readonly note: string | null,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Relations (optional, populated when included)
    public readonly document?: any,
    public readonly folder?: any,
    public readonly toDivision?: any,
    public readonly createdBy?: any,
  ) {}

  get isReturned(): boolean {
    return this.returnedAt !== null || this.status === 'RETURNED';
  }
}
