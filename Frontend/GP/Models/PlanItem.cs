using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class PlanItem : BaseEntity
    {
        [Key]
        public int PlanItemId { get; set; }
        public int PlanId { get; set; }
        public Plan Plan { get; set; }
        public int SessionId { get; set; }
        public Session Session { get; set; }
        public int  CurriculumItemId { get; set; }
        public CurriculumItem CurriculumItem { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; }
        public string Title { get; set; }
        public int UnitNo { get; set; }
        public int LessonNo { get; set; }
        public int OrderInLesson { get; set; }
        public int EstimatedTime { get; set; }
        public string Status { get; set; }
        public int OriginalSessionId { get; set; }
        public OriginalSession OriginalSession { get; set; }
        public int? OriginalSessionOrder { get; set; }
        public int? CarriedForwardCount { get; set; }
        public string? Notes { get; set; }
    }
}
