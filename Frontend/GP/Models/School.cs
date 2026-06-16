using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class School : BaseEntity
    {
        [Key]
        public int SchoolId { get; set; }
        public string SchoolName { get; set; }
    }
}
