using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GP.Models
{
    public class QuizResult : BaseEntity
    {
        [Key]
        public int QuizResultId { get; set; }

        public int StudentId { get; set; }
        public Student Student { get; set; }

        public int SupportProgramId { get; set; }
        public SupportProgram SupportProgram { get; set; }

        public int MilestoneId { get; set; }
        public Milestone Milestone { get; set; }

        public int QuizId { get; set; }
        public Quiz Quiz { get; set; }

        public double Score { get; set; }
        public string Status { get; set; }

        public string AnswersJson { get; set; }

        [NotMapped]
        public List<object> Answers
        {
            get => string.IsNullOrEmpty(AnswersJson)
                ? new List<object>()
                : JsonSerializer.Deserialize<List<object>>(AnswersJson);

            set => AnswersJson = JsonSerializer.Serialize(value);
        }

        public string? Feedback { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}