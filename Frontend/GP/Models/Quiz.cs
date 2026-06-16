using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Quiz : BaseEntity
    {
        [Key]
        public int QuizId { get; set; }
        public int SupportProgramId { get; set; }
        public SupportProgram SupportProgram { get; set; }
        public int MilestoneId { get; set; }
        public Milestone Milestone { get; set; }   
        public string Title { get; set; }
        public List<QuizQuestion> Questions { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
