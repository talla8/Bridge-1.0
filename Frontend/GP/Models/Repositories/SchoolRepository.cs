using GP.Data;

namespace GP.Models.Repositories
{
    public class SchoolRepository : IRepository<School>
    {
        public AppDbContext db { get; }
        public SchoolRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.School.Update(entity);
            db.SaveChanges();
        }

        public void Add(School entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.School.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.School.Update(entity);
            db.SaveChanges();
        }

        public School Find(int Id)
        {
            return db.School.SingleOrDefault(x => x.SchoolId == Id);
        }

        public void Update(int Id, School entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.School.Update(entity);
            db.SaveChanges();
        }

        public List<School> ViewAdmin()
        {
            return db.School.Where(x => x.IsDelete == false).ToList();
        }

        public List<School> ViewClient()
        {
            return db.School.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
