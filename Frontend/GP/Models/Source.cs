using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Source : BaseEntity
    {
        [Key]
        public int SourceId { get; set; }
    }
}
