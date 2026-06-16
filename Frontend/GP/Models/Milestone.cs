using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Milestone : BaseEntity
    {
        [Key]
        public int MilestoneId { get; set; }
    }
}
