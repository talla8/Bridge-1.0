using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Grade : BaseEntity
    {
        [Key]
        public int GradeId { get; set; }

            public string GradeName { get; set; } // change this

            public string? SchoolName { get; set; }

            public int TeacherId { get; set; }
            public  Teacher Teacher { get; set; }   
    }
}
