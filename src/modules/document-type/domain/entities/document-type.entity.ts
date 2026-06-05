export class DocumentType {
  constructor(
    public readonly id: string,
    public code: string | null,
    public name: string,
    public description: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
