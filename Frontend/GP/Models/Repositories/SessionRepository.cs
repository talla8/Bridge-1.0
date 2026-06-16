using GP.Data;

namespace GP.Models.Repositories
{
    public class SessionRepository : IRepository<Session>
    {
        public AppDbContext db { get; }
        public SessionRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Session.Update(entity);
            db.SaveChanges();
        }

        public void Add(Session entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Session.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Session.Update(entity);
            db.SaveChanges();
        }

        public Session Find(int Id)
        {
            return db.Session.SingleOrDefault(x => x.SessionId == Id);
        }

        public void Update(int Id, Session entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Session.Update(entity);
            db.SaveChanges();
        }

        public List<Session> ViewAdmin()
        {
            return db.Session.Where(x => x.IsDelete == false).ToList();
        }

        public List<Session> ViewClient()
        {
            return db.Session.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
