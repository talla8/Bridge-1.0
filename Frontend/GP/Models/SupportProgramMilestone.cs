using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GP.Models
{
    public class SupportProgramMilestone : BaseEntity
    {
        [Key]

        public int MilestoneId { get; set; }
        public Milestone Milestone { get; set; }
        public int MilestoneNo { get; set; }
        public string Name { get; set; }
        public string Goal { get; set; }

        public int? RequiredExerciseCount { get; set; }
        public double? RequiredQuizScore { get; set; }
        public int? RequiredQuizCount { get; set; }
        public double? RequiredAverageScore { get; set; }

        public string ItemsJson { get; set; }

        [NotMapped]
        public List<object> Items
        {
            get => string.IsNullOrEmpty(ItemsJson)
                ? new List<object>()
                : JsonSerializer.Deserialize<List<object>>(ItemsJson);

            set => ItemsJson = JsonSerializer.Serialize(value);
        }
    }
}