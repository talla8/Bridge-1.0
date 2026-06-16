using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GP.Models
{
    public class Assignment : BaseEntity
    {
        [Key]
        public int AssignmentId { get; set; }

        public int TeacherId { get; set; }
        public Teacher Teacher { get; set; }

        public int SubjectId { get; set; }
        public Subject Subject { get; set; }

        public string Title { get; set; }
        public string Type { get; set; }
        public string SourceType { get; set; }

        public int SourceId { get; set; }
        public Source Source { get; set; }

        public string TargetType { get; set; }

        public string TargetStudentIdsJson { get; set; }

        [NotMapped]
        public List<string> TargetStudentIds
        {
            get => string.IsNullOrEmpty(TargetStudentIdsJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(TargetStudentIdsJson);

            set => TargetStudentIdsJson = JsonSerializer.Serialize(value);
        }

        public TargetStudent TargetStudent { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? DueDate { get; set; }

        public string Status { get; set; }
    }
}