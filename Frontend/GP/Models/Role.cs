using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Role : BaseEntity
    {
        [Key]
        public int RoleId { get; set; }
    }
}
