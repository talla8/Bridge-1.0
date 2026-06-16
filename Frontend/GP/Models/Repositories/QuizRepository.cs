using GP.Data;

namespace GP.Models.Repositories
{
    public class QuizRepository : IRepository<Quiz>
    {
        public AppDbContext db { get; }
        public QuizRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Quiz.Update(entity);
            db.SaveChanges();
        }

        public void Add(Quiz entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Quiz.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Quiz.Update(entity);
            db.SaveChanges();
        }

        public Quiz Find(int Id)
        {
            return db.Quiz.SingleOrDefault(x => x.QuizId == Id);
        }

        public void Update(int Id, Quiz entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Quiz.Update(entity);
            db.SaveChanges();
        }

        public List<Quiz> ViewAdmin()
        {
            return db.Quiz.Where(x => x.IsDelete == false).ToList();
        }

        public List<Quiz> ViewClient()
        {
            return db.Quiz.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
