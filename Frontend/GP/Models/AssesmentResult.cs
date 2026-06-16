using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class AssesmentResult:BaseEntity
    {
        [Key]
        public int AssesmentResultId {  get; set; }
        public int UploadId {  get; set; }
        public Upload Upload { get; set; }
        public int StudentId { get; set; }
        public Student Student { get; set; }
        public int SkillId { get; set; }
        public Skill Skill { get; set; }
        public double TotalScoure {  get; set; }
        public string Level {  get; set; }

    }
}
