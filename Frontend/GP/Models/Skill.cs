using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Skill : BaseEntity
    {
        [Key]
        public int SkillId { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; }
        public int GradeId { get; set; }
        public Grade Grade { get; set; }
        public string Code { get; set; }
        public string Title { get; set; }
        public double MaxScore { get; set; }
    }
}
