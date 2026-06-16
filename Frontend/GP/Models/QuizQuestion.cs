using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace GP.Models
{
    public class QuizQuestion : BaseEntity
    {
        [Key]
        public int QuizQuestionId { get; set; }
        public string Prompt { get; set; }
        public string Type { get; set; }

        public string OptionsJson { get; set; }

        [NotMapped]
        public List<object> Options
        {
            get => string.IsNullOrEmpty(OptionsJson)
                ? new List<object>()
                : JsonSerializer.Deserialize<List<object>>(OptionsJson);

            set => OptionsJson = JsonSerializer.Serialize(value);
        }
    }
}