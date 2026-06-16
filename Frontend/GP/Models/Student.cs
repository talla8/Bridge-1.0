using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Student : BaseEntity
    {
        [Key]
        public int StudentId { get; set; }
        public string FullEnglishName { get; set; }
        public string FullArabicName { get; set; }
        public int NationalId { get; set; }
        public National National { get; set; }
        public int ParentId { get; set; }
        public Parent Parent { get; set; }
        public string ParentLinkCode { get; set; }
        public int GradeId { get; set; }
        public Grade Grade { get; set; }    
        public string? SchoolName { get; set; }
        public string? ParentRelation { get; set; }
        public bool IsActive { get; set; }
    }
}
