export class Branch {
  constructor(
    public code: string | '',
    public name: string,
    public status: string | '',
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
