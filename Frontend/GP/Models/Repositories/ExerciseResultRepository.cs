using GP.Data;

namespace GP.Models.Repositories
{
    public class ExerciseResultRepository : IRepository<ExerciseResult>
    {
        public AppDbContext db { get; }
        public ExerciseResultRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.ExerciseResult.Update(entity);
            db.SaveChanges();
        }

        public void Add(ExerciseResult entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.ExerciseResult.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.ExerciseResult.Update(entity);
            db.SaveChanges();
        }

        public ExerciseResult Find(int Id)
        {
            return db.ExerciseResult.SingleOrDefault(x => x.ExerciseResultId == Id);
        }

        public void Update(int Id, ExerciseResult entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.ExerciseResult.Update(entity);
            db.SaveChanges();
        }

        public List<ExerciseResult> ViewAdmin()
        {
            return db.ExerciseResult.Where(x => x.IsDelete == false).ToList();
        }

        public List<ExerciseResult> ViewClient()
        {
            return db.ExerciseResult.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
