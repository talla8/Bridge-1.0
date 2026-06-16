using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class SubjectOffering : BaseEntity
    {
        [Key]
        public int SubjectOfferingId { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; }
        public int GradeId { get; set; }
        public Grade Grade { get; set; }
        public int TeacherId { get; set; }
        public Teacher Teacher { get; set; }
        public int SchoolId { get; set; }
        public School School { get; set; }
        public string SchoolYear { get; set; }
    }
}
