using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Session : BaseEntity
    {
        [Key]
        public int SessionId { get; set; }
        public int TeacherId { get; set; }
        public Teacher Teacher {  get; set; }

        public int  SubjectId { get; set; }
        public Subject Subject { get; set; }
        public string Day { get; set; }
        public List<PlanItem> Items { get; set; }
        public int MaxDuration { get; set; }
        public int UsedDuration { get; set; }
        public int ReviewBufferMinutes { get; set; }
        public int SlotNumber { get; set; }
        public DateTime SessionDate { get; set; }
        public int SessionWeekNo { get; set; }
    }
}
