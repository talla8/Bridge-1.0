using GP.Data;

namespace GP.Models.Repositories
{
    public class AssignmentRepository : IRepository<Assignment>
    {
        public AppDbContext db { get; }
        public AssignmentRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Assignment.Update(entity);
            db.SaveChanges();
        }

        public void Add(Assignment entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Assignment.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Assignment.Update(entity);
            db.SaveChanges();
        }

        public Assignment Find(int Id)
        {
            return db.Assignment.SingleOrDefault(x => x.AssignmentId == Id);
        }

        public void Update(int Id, Assignment entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Assignment.Update(entity);
            db.SaveChanges();
        }

        public List<Assignment> ViewAdmin()
        {
            return db.Assignment.Where(x => x.IsDelete == false).ToList();
        }

        public List<Assignment> ViewClient()
        {
            return db.Assignment.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
