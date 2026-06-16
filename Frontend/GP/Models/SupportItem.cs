using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class SupportItem : BaseEntity
    {
        [Key]

        public int SupportItemId {  get; set; }
    }
}
