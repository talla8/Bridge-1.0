using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class National : BaseEntity
    {
        [Key]
        public int NationalId { get; set; }
    }
}
