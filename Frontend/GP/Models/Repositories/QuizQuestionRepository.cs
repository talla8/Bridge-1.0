using GP.Data;

namespace GP.Models.Repositories
{
    public class QuizQuestionRepository : IRepository<QuizQuestion>
    {
        public AppDbContext db { get; }
        public QuizQuestionRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.QuizQuestion.Update(entity);
            db.SaveChanges();
        }

        public void Add(QuizQuestion entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.QuizQuestion.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.QuizQuestion.Update(entity);
            db.SaveChanges();
        }

        public QuizQuestion Find(int Id)
        {
            return db.QuizQuestion.SingleOrDefault(x => x.QuizQuestionId == Id);
        }

        public void Update(int Id, QuizQuestion entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.QuizQuestion.Update(entity);
            db.SaveChanges();
        }

        public List<QuizQuestion> ViewAdmin()
        {
            return db.QuizQuestion.Where(x => x.IsDelete == false).ToList();
        }

        public List<QuizQuestion> ViewClient()
        {
            return db.QuizQuestion.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
