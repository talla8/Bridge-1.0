using GP.Data;

namespace GP.Models.Repositories
{
    public class QuizResultRepository : IRepository<QuizResult>
    {
        public AppDbContext db { get; }
        public QuizResultRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.QuizResult.Update(entity);
            db.SaveChanges();
        }

        public void Add(QuizResult entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.QuizResult.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.QuizResult.Update(entity);
            db.SaveChanges();
        }

        public QuizResult Find(int Id)
        {
            return db.QuizResult.SingleOrDefault(x => x.QuizResultId == Id);
        }

        public void Update(int Id, QuizResult entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.QuizResult.Update(entity);
            db.SaveChanges();
        }

        public List<QuizResult> ViewAdmin()
        {
            return db.QuizResult.Where(x => x.IsDelete == false).ToList();
        }

        public List<QuizResult> ViewClient()
        {
            return db.QuizResult.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
