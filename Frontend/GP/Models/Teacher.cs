using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Teacher : BaseEntity
    {
        [Key]

        public int TeacherId { get; set; }
    }
}
