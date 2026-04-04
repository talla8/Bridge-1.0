import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { filter } from 'rxjs';
import { CurriculumItem } from 'src/domain/curriculum-item';
import { GradeId, SubjectId } from 'src/domain/ids';
import { CurriculumItemRepository } from 'src/repositories/curriculum-item.repository';

@Injectable()
export class InMemoryCurriculumItemsRepo implements CurriculumItemRepository {
  private curriculumItems: CurriculumItem[] = [];

  async create(curriculumItem: CurriculumItem): Promise<CurriculumItem> {
    this.curriculumItems.push(curriculumItem);
    return curriculumItem;
  }

  async findById(id: string): Promise<CurriculumItem | null> {
    return (
      this.curriculumItems.find(
        (curriculumItem: CurriculumItem): boolean =>
          curriculumItem.curriculumItemId === id,
      ) ?? null
    );
  }
  async getRequiredItme(filters: {
    grade: GradeId;
    subject: SubjectId;
    semester: 1 | 2;
  }): Promise<CurriculumItem[]> {
    if (!filters) {
      throw new BadRequestException();
    }
    const grade = filters.grade;
    const subject = filters.subject;
    const semester = filters.semester;
    return this.curriculumItems.filter(function (
      curriculumItem: CurriculumItem,
    ) {
      const gradeOk =
        String(grade) === String(curriculumItem.gradeId) ? true : false;
      const subjectOk =
        String(subject) === String(curriculumItem.subjectId) ? true : false;
      const semesterOk =
        String(semester) === String(curriculumItem.semester) ? true : false;
      return gradeOk && subjectOk && semesterOk;
    });
  }

  async findAll(): Promise<CurriculumItem[]> {
    return this.curriculumItems;
  }

  async update(
    id: string,
    patch: Partial<CurriculumItem>,
  ): Promise<CurriculumItem | null> {
    const index = this.curriculumItems.findIndex(
      (item: CurriculumItem): boolean => item.curriculumItemId === id,
    );
    if (index === -1) return null;

    const updated: CurriculumItem = {
      ...this.curriculumItems[index],
      ...patch,
    };
    this.curriculumItems[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.curriculumItems.findIndex(
      (item: CurriculumItem): boolean => item.curriculumItemId === id,
    );
    if (index === -1) return false;

    this.curriculumItems.splice(index, 1);
    return true;
  }
}
