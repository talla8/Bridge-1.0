using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class SupportProgram : BaseEntity
    {
        [Key]

        public int SupportProgramId { get; set; }
        public string ProgramName { get; set; }
        public int GradeId { get; set; }
        public Grade Grade { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; }
        public string TargetSkill { get; set; }
        public int SourceUnitNo { get; set; }
        public int SourceLessonNo { get; set; }
        public List<SupportProgramMilestone> Milestones { get; set; }
    }
}
