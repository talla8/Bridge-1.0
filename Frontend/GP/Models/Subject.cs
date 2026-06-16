using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Subject : BaseEntity
    {
        [Key]
        public int SubjectId { get; set; }
        public string SubjectName { get; set; }
        public string SchoolYear { get; set; }
    }
}
