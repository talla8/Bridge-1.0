using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class ExerciseResult : BaseEntity
    {
        [Key]
        public int ExerciseResultId { get; set; }

        public int StudentId { get; set; }
        public Student Student { get; set; }

        public  int SupportProgramId { get; set; }
        public SupportProgram SupportProgram { get; set; }

        public int MilestoneId { get; set; }
        public Milestone Milestone { get; set; }

        public int SupportItemId { get; set; }
        public SupportItem SupportItem { get; set; }

        public bool Passed { get; set; }

        public string Status { get; set; }

        public string? Answer { get; set; }

        public string? Feedback { get; set; }

        public DateTime SubmittedAt { get; set; }

        public DateTime? ReviewedAt { get; set; }
    }
}
