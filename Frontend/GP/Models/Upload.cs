using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Upload : BaseEntity
    {
        [Key]

        public int UploadId { get; set; }
        public int TeacherId { get; set; }
        public Teacher Teacher { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; }
        public string FilePath { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
