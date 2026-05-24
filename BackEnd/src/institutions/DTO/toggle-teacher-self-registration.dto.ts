import { IsBoolean } from 'class-validator';

export class ToggleTeacherSelfRegistrationDTO {
  @IsBoolean()
  enabled: boolean;
}
