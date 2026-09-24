import { employeeRepository, EmployeeRepository } from "@/src/core/repositories/employee.repository";

export class EmployeeService {
  constructor(private readonly repository: EmployeeRepository) {}

  listOptions() {
    return this.repository.findOptions();
  }
}

export const employeeService = new EmployeeService(employeeRepository);
