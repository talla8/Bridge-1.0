using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GP.Models
{
    public class CurriculumItem : BaseEntity
    {
        [Key]
        public int CurriculumItemId { get; set; }
        public int UnitNo { get; set; }
        public int LessonNo { get; set; }
        public int OrderInLesson { get; set; }

        public string Semester { get; set; }
        public string Name { get; set; }

        public int GradeId { get; set; }
        public Grade Grade { get; set; }

        public int SubjectId { get; set; }
        public Subject Subject { get; set; }

        public string SkillsSupportedJson { get; set; }

        [NotMapped]
        public List<string> SkillsSupported
        {
            get => string.IsNullOrEmpty(SkillsSupportedJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(SkillsSupportedJson);

            set => SkillsSupportedJson = JsonSerializer.Serialize(value);
        }

        public string EstimatedTime { get; set; }
        public int Difficulty { get; set; }
    }
}