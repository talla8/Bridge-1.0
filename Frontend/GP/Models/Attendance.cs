using System.ComponentModel.DataAnnotations;

namespace GP.Models
{
    public class Attendance : BaseEntity
    {
        [Key]
        public int AttendanceId { get; set; }

        public int GradeId { get; set; }
        public Grade Grade { get; set; }

        public int StudentId { get; set; }
        public Student Student { get; set; }

        public DateTime AtDate { get; set; }

        public string Status { get; set; }
    }
}
