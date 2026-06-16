using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Parent : BaseEntity
    {
        [Key]
        public int ParentId { get; set; }
    }
}
