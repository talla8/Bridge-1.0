import { Injectable } from '@nestjs/common';
import { Assignment } from 'src/domain/assignment';
import { AssignmentRepository } from 'src/repositories/assignment.repository';

@Injectable()
export class InMemoryAssignmentsRepo implements AssignmentRepository {
  private assignments: Assignment[] = [];

  async create(assignment: Assignment): Promise<Assignment> {
    this.assignments.push(assignment);
    return assignment;
  }

  async findById(id: string): Promise<Assignment | null> {
    return (
      this.assignments.find((assignment) => assignment.assignmentId === id) ??
      null
    );
  }

  async findAll(): Promise<Assignment[]> {
    return this.assignments;
  }

  async findByTeacherId(teacherId: string): Promise<Assignment[]> {
    return this.assignments.filter(
      (assignment) => String(assignment.teacherId) === String(teacherId),
    );
  }

  async findByStudentId(studentId: string): Promise<Assignment[]> {
    return this.assignments.filter((assignment) =>
      assignment.targetStudentIds.includes(studentId),
    );
  }

  async update(
    id: string,
    patch: Partial<Assignment>,
  ): Promise<Assignment | null> {
    const index = this.assignments.findIndex(
      (assignment) => assignment.assignmentId === id,
    );
    if (index === -1) return null;

    const updated: Assignment = {
      ...this.assignments[index],
      ...patch,
    };
    this.assignments[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.assignments.findIndex(
      (assignment) => assignment.assignmentId === id,
    );
    if (index === -1) return false;

    this.assignments.splice(index, 1);
    return true;
  }
}
