import { IsBoolean } from 'class-validator';

export class UpdateInstitutionTaskVisibilityDTO {
  @IsBoolean()
  isHidden: boolean;
}
