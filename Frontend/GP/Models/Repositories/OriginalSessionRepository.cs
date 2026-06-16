using GP.Data;

namespace GP.Models.Repositories
{
    public class OriginalSessionRepository : IRepository<OriginalSession>
    {
        public AppDbContext db { get; }
        public OriginalSessionRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.OriginalSession.Update(entity);
            db.SaveChanges();
        }

        public void Add(OriginalSession entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.OriginalSession.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.OriginalSession.Update(entity);
            db.SaveChanges();
        }

        public OriginalSession Find(int Id)
        {
            return db.OriginalSession.SingleOrDefault(x => x.OriginalSessionId == Id);
        }

        public void Update(int Id, OriginalSession entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.OriginalSession.Update(entity);
            db.SaveChanges();
        }

        public List<OriginalSession> ViewAdmin()
        {
            return db.OriginalSession.Where(x => x.IsDelete == false).ToList();
        }

        public List<OriginalSession> ViewClient()
        {
            return db.OriginalSession.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
