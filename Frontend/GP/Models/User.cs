using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class User : BaseEntity
    {

        [Key]

        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public int RoleId { get; set; }
        public Role Role { get; set; }
        public bool IsActive { get; set; }
        public bool IsVerified { get; set; }
    }
}
