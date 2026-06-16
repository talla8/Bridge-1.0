using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class TargetStudent : BaseEntity
    {
        [Key]

        public int TargetStudentId { get; set; }
    }
}
