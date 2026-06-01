export class Department {
  constructor(
    public readonly id: number,
    public code: string,
    public name: string,
    public phone: string,
    public email: string,
    public status: string,
  ) {}
}
