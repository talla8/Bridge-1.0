using GP.Data;

namespace GP.Models.Repositories
{
    public class SubjectRepository : IRepository<Subject>
    {
        public AppDbContext db { get; }
        public SubjectRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Subject.Update(entity);
            db.SaveChanges();
        }

        public void Add(Subject entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Subject.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Subject.Update(entity);
            db.SaveChanges();
        }

        public Subject Find(int Id)
        {
            return db.Subject.SingleOrDefault(x => x.SubjectId == Id);
        }

        public void Update(int Id, Subject entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Subject.Update(entity);
            db.SaveChanges();
        }

        public List<Subject> ViewAdmin()
        {
            return db.Subject.Where(x => x.IsDelete == false).ToList();
        }

        public List<Subject> ViewClient()
        {
            return db.Subject.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
