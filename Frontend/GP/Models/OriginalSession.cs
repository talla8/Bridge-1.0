using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class OriginalSession : BaseEntity
    {
        [Key]
        public int OriginalSessionId {  get; set; }
    }
}
