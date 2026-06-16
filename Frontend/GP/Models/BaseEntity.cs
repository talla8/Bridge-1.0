namespace GP.Models
{
    public class BaseEntity
    {
        public bool IsDelete { get; set; }
        public bool IsActive { get; set; }
        public string? CreatedId { get; set; }
        public DateTime CreateDate { get; set; }
        public string? EditId { get; set; }
        public DateTime EditDate { get; set; }
    }
    public class TransactionBaseEntity
    {
        public string? CreateId { get; set; }
        public DateTime CreateDate { get; set; }
    }
}
