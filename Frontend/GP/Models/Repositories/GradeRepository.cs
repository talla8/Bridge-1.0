using GP.Data;

namespace GP.Models.Repositories
{
    public class GradeRepository : IRepository<Grade>
    {
        public AppDbContext db { get; }
        public GradeRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Grade.Update(entity);
            db.SaveChanges();
        }

        public void Add(Grade entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Grade.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Grade.Update(entity);
            db.SaveChanges();
        }

        public Grade Find(int Id)
        {
            return db.Grade.SingleOrDefault(x => x.GradeId == Id);
        }

        public void Update(int Id, Grade entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Grade.Update(entity);
            db.SaveChanges();
        }

        public List<Grade> ViewAdmin()
        {
            return db.Grade.Where(x => x.IsDelete == false).ToList();
        }

        public List<Grade> ViewClient()
        {
            return db.Grade.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
