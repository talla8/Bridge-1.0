using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class VerificationToken : BaseEntity
    {
        [Key]

        public int VerificationTokenId { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public string TokenHash { get; set; }
        public string Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
    }
}
