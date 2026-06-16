using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class SkillCurriculumItem : BaseEntity
    {
        [Key]
        public int SkillCurriculumItemId { get; set; }
        public int CurriculumItemId { get; set; }
        public CurriculumItem CurriculumItem { get; set; }
        public double Weight { get; set; }
    }
}
