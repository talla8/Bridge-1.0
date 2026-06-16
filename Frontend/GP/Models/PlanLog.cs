using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class PlanLog : BaseEntity
    {
        [Key]
        public int PlanLogId { get; set; }
        public int PlanId { get; set; }
        public Plan Plan { get; set; }
        public int? SessionId { get; set; }
        public Session Session { get; set; }
        public int? PlanItemId { get; set; }
        public PlanItem PlanItem { get; set; }
        public int? CurriculumItemId { get; set; }
        public CurriculumItem CurriculumItem { get; set; }
        public string ActionType { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Metadata { get; set; }
    }
}
